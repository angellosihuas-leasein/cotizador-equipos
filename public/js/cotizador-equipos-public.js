(function () {
  "use strict";

  function initCotizadores() {
    var containers = document.querySelectorAll(".ce-cotizador[data-ce-config]");
    containers.forEach(function (container) {
      if (!container.getAttribute("data-ce-config")) return;
      try { new CotizadorUI(container, JSON.parse(container.getAttribute("data-ce-config"))).mount(); } 
      catch (e) { console.error("Error cargando cotizador:", e); }
    });
  }

  function CotizadorUI(root, config) {
    this.root = root;
    this.config = this.normalizeConfig(config);
    this.state = { 
        step: 0, 
        processorId: null, 
        gamaId: null, 
        timeUnit: 'meses', 
        timeValue: 1, 
        quantity: 1,
        selectedExtras: { ram: '', almacenamiento: '' },
        isModalOpen: false
    };
  }

  CotizadorUI.prototype.mount = function () {
    this.root.innerHTML = '<div class="ce-cotizador-wrapper"><div class="ceq-stage"><div class="ceq-header"></div><div class="ceq-body"></div><div class="ceq-footer"></div></div><div class="ceq-modal-root"></div></div>';
    this.bindEvents();
    this.render();
  };

  CotizadorUI.prototype.bindEvents = function () {
    var self = this;
    
    this.root.addEventListener("click", function (e) {
      if (e.target.classList.contains("ceq-modal-overlay")) {
          self.closeModal();
          return;
      }

      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      
      if (action === "start-smart") self.goToStep(1);
      if (action === "go-manual") {
          if(!self.state.processorId && self.config.processors.length) self.state.processorId = self.config.processors[0].id;
          if(!self.state.gamaId && self.config.gamas.length) self.state.gamaId = self.config.gamas[0].id;
          self.goToStep(5);
      }

      if (action === "next" && self.canContinue()) self.goToStep(self.state.step + 1);
      if (action === "back") self.goToStep(self.state.step === 5 ? 0 : self.state.step - 1);
      if (action === "restart") { 
          self.state.step = 0; self.state.quantity = 1; self.state.timeValue = 1; 
          self.state.selectedExtras = { ram: '', almacenamiento: '' };
          self.goToStep(0); 
      }
      
      if (action === "select-processor") { self.state.processorId = btn.getAttribute("data-value"); self.renderBody(); self.renderFooter(); }
      if (action === "select-gama") { self.state.gamaId = btn.getAttribute("data-value"); self.renderBody(); self.renderFooter(); }
      
      if (action === "set-unit") { self.state.timeUnit = btn.getAttribute("data-value"); self.state.timeValue = 1; self.renderBody(); self.renderFooter(); }
      
      if (action === "time-minus") { self.state.timeValue = Math.max(1, self.state.timeValue - parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }
      if (action === "time-plus") { self.state.timeValue = Math.min(999, self.state.timeValue + parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }
      
      if (action === "qty-minus") { self.state.quantity = Math.max(1, self.state.quantity - parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }
      if (action === "qty-plus") { self.state.quantity = Math.min(999, self.state.quantity + parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }

      if (action === "open-modal") { self.state.isModalOpen = true; self.renderModal(); }
      if (action === "close-modal") { self.closeModal(); }
    });

    this.root.addEventListener("change", function(e) {
        var action = e.target.getAttribute("data-action");
        if (action === "change-proc") { self.state.processorId = e.target.value; self.renderBody(); self.renderFooter(); }
        if (action === "change-gama") { self.state.gamaId = e.target.value; self.renderBody(); self.renderFooter(); }
        if (action === "change-extra") {
            var type = e.target.getAttribute("data-type");
            self.state.selectedExtras[type] = e.target.value;
            self.renderBody(); self.renderFooter();
        }
    });

    this.root.addEventListener("submit", function(e) {
        if(e.target.id === "ceq-quote-form") {
            e.preventDefault();
            var btn = e.target.querySelector('button[type="submit"]');
            btn.innerHTML = '<svg style="width:20px;height:20px;animation:spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Enviando...';
            btn.disabled = true;

            setTimeout(function() {
                var modalBox = self.root.querySelector(".ceq-modal-box");
                modalBox.innerHTML = `
                    <div class="ceq-success">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h3>¡Cotización enviada!</h3>
                        <p>Hemos enviado un PDF formal con todos los detalles a tu correo electrónico.</p>
                        <button type="button" class="ceq-btn-primary ceq-btn-block" data-action="close-modal">Aceptar y cerrar</button>
                    </div>
                `;
            }, 1200);
        }
    });
  };

  CotizadorUI.prototype.closeModal = function () {
    var self = this;
    var overlay = this.root.querySelector(".ceq-modal-overlay");
    if (overlay) overlay.classList.add("is-closing");
    setTimeout(function() {
        self.state.isModalOpen = false;
        self.renderModal();
    }, 280); 
  };

  CotizadorUI.prototype.goToStep = function (step) {
    var stage = this.root.querySelector(".ceq-stage");
    var self = this;
    stage.classList.remove("is-entering");
    stage.classList.add("is-leaving");
    setTimeout(function () {
      self.state.step = step;
      self.render();
      stage.classList.remove("is-leaving");
      stage.classList.add("is-entering");
      setTimeout(() => stage.classList.remove("is-entering"), 300);
    }, 250);
  };

  CotizadorUI.prototype.render = function () {
    this.renderHeader();
    this.renderBody();
    this.renderFooter();
    this.renderModal();
  };

  CotizadorUI.prototype.renderHeader = function () {
    if (this.state.step === 0) {
        this.root.querySelector(".ceq-header").innerHTML = '';
        return;
    }

    var t = this.config.texts || {};
    var st = {
      1: { eye: t.step1_eyebrow, title: t.step1_title, sub: t.step1_subtitle },
      2: { eye: t.step2_eyebrow, title: t.step2_title, sub: t.step2_subtitle },
      3: { eye: t.step3_eyebrow, title: t.step3_title, sub: t.step3_subtitle },
      4: { eye: t.step4_eyebrow, title: t.step4_title, sub: t.step4_subtitle },
      5: { eye: 'MODO MANUAL', title: t.manual_title || 'Configuración Rápida', sub: 'Personaliza tu equipo, extras y tiempo al instante.' }
    }[this.state.step];
    
    this.root.querySelector(".ceq-header").innerHTML = 
      '<span class="ceq-eyebrow">' + (st.eye || '') + '</span><h2 class="ceq-title">' + (st.title || '') + '</h2><p class="ceq-subtitle">' + (st.sub || '') + '</p>';
  };

  CotizadorUI.prototype.getIcon = function(step, i) {
    var s1 = ['<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>', '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round"/></svg>'];
    var s2 = ['<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="6" width="18" height="12" rx="2" stroke-width="2"/><path d="M8 21h8m-4-3v3" stroke-width="2" stroke-linecap="round"/></svg>', '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="4" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>', '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2l3 6 6 .5-4.5 4.5 1 6-5.5-3-5.5 3 1-6L3 8.5l6-.5z" stroke-width="2" stroke-linejoin="round"/></svg>'];
    return (step === 1 ? s1[i % s1.length] : s2[i % s2.length]);
  };

  CotizadorUI.prototype.getRadioSvg = function(isSelected) {
      if(isSelected) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#ea580c" stroke-width="2" fill="#ea580c"/><circle cx="12" cy="12" r="4" fill="white"/></svg>';
      return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#e5e7eb" stroke-width="2" fill="white"/></svg>';
  }

  CotizadorUI.prototype.renderBody = function () {
    var body = this.root.querySelector(".ceq-body");
    var self = this;
    var t = this.config.texts || {};

    // Paso 0: Bienvenida (Agregando validación de datos seguros)

    if (this.state.step === 0) {
        var wTitle = t.welcome_title || 'Cotiza el alquiler de laptops para tu empresa en segundos';
        var wSub = t.welcome_subtitle || 'Obtén precios al instante con nuestro cotizador digital o configura una propuesta técnica a medida.';
        var wBtnSmart = t.btn_smart || 'Iniciar cotización inteligente →';
        var wBtnManual = t.btn_manual || 'Configura aquí';

        body.innerHTML = `
            <div class="ceq-welcome-wrap">
                <div class="ceq-welcome-content">
                    <h1 class="ceq-title ceq-welcome-title">${wTitle}</h1>
                    <p class="ceq-subtitle ceq-welcome-subtitle">${wSub}</p>
                    <div class="ceq-welcome-actions">
                        <button class="ceq-btn-primary" data-action="start-smart">${wBtnSmart}</button>
                        <button class="ceq-btn-outline" data-action="go-manual">
                            <svg style="width:24px;height:24px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <g class="ceq-slider-top">
                                    <line x1="6" y1="8" x2="20" y2="8" stroke-width="2.5" stroke-linecap="round"></line>
                                    <circle cx="6" cy="8" r="2.5" fill="#ffffff" class="ceq-slider-circle" stroke-width="2.5"></circle>
                                </g>
                                <g class="ceq-slider-bottom">
                                    <line x1="4" y1="16" x2="18" y2="16" stroke-width="2.5" stroke-linecap="round"></line>
                                    <circle cx="18" cy="16" r="2.5" fill="#ffffff" class="ceq-slider-circle" stroke-width="2.5"></circle>
                                </g>
                            </svg> 
                            ${wBtnManual}
                        </button>
                    </div>
                </div>
                <div class="ceq-welcome-visual">
                    <img src="URL_DE_LA_FOTO_AQUI.png" alt="Especialista" class="ceq-welcome-img" />
                </div>
            </div>
        `;
        return;
    }

    // Pasos clásicos 1 y 2
    if (this.state.step === 1 || this.state.step === 2) {
      var items = this.state.step === 1 ? this.config.processors : this.config.gamas;
      var selectedId = this.state.step === 1 ? this.state.processorId : this.state.gamaId;
      var action = this.state.step === 1 ? "select-processor" : "select-gama";
      
      var waBtn = this.state.step === 1 ? 
        '<a class="ceq-whatsapp-cta" href="'+(t.whatsapp_url || 'https://wa.me/')+'" target="_blank">' +
        '<span class="ceq-wa-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></span>' +
        '<span class="ceq-wa-text"><span class="ceq-wa-title">'+ (t.whatsapp_label || 'Quiero hablar con un especialista') +'</span><span class="ceq-wa-desc">'+ (t.whatsapp_desc || '') +'</span></span>' +
        '<span style="color:#ea580c; font-size:24px; font-weight:300;">→</span></a>' : '';

      var manualLink = this.state.step === 1 ? '<div style="text-align:center; margin-top:24px;"><button type="button" class="ceq-btn-ghost" style="color:#ea580c; font-size:15px; text-decoration:underline;" data-action="go-manual">' + (t.manual_link || '¿Ya conoces lo que quieres? Configúralo manualmente') + '</button></div>' : '';

      var html = '<div class="ceq-options">';
      items.forEach(function (item, i) {
        var isSelected = item.id === selectedId;
        var displayTitle = (item.front_label && item.front_label.trim() !== "") ? item.front_label : item.label;

        html += '<button type="button" class="ceq-option ' + (isSelected ? "is-selected" : "") + '" data-action="' + action + '" data-value="' + item.id + '">' +
                '<span class="ceq-opt-icon">' + self.getIcon(self.state.step, i) + '</span>' +
                '<span class="ceq-opt-main"><span class="ceq-opt-title">' + displayTitle + '</span><span class="ceq-opt-desc">' + item.description + '</span></span>' +
                '<span class="ceq-opt-radio">' + self.getRadioSvg(isSelected) + '</span></button>';
      });
      body.innerHTML = html + '</div>' + waBtn + manualLink;
      return;
    }

    // Variables de Texto y Cálculo General para Pasos 3, 4 y 5
    var singleUnit = this.state.timeUnit === 'meses' ? 'mes' : 'semana';
    var timeLabel = this.state.timeUnit === 'meses' ? 'POR MES' : 'POR SEMANA';
    var qtyLabel = this.state.quantity > 1 ? 'laptops' : 'laptop';
    
    var pBase = this.getBasePrice(); // Precio unitario (por laptop) en el periodo (mes/semana)
    var tPricePerPeriod = pBase * this.state.quantity; // Costo por mes o semana de TODAS las laptops
    var finalPriceAbsolute = tPricePerPeriod * this.state.timeValue; // Costo total del contrato de inicio a fin

    // Paso 5: Modo Manual con Extras
    if (this.state.step === 5) {
      var procsHtml = '<select class="ceq-form-input" data-action="change-proc">';
      this.config.processors.forEach(p => { procsHtml += `<option value="${p.id}" ${p.id===this.state.processorId?'selected':''}>${p.label}</option>`; });
      procsHtml += '</select>';

      var gamasHtml = '<select class="ceq-form-input" data-action="change-gama">';
      this.config.gamas.forEach(g => { gamasHtml += `<option value="${g.id}" ${g.id===this.state.gamaId?'selected':''}>${g.label}</option>`; });
      gamasHtml += '</select>';

      var rams = this.config.extras.filter(e => e.type === 'ram');
      var almacenamientos = this.config.extras.filter(e => e.type === 'almacenamiento');
      
      var extrasHtml = '';
      if (rams.length > 0 || almacenamientos.length > 0) {
          extrasHtml = '<div class="ceq-box-title" style="margin-top:24px; margin-bottom:12px;">Extras y Adicionales</div>';
          
          if (rams.length > 0) {
              extrasHtml += `<div class="ceq-form-group"><label class="ceq-form-label">Memoria RAM</label><select class="ceq-form-input" data-action="change-extra" data-type="ram"><option value="">Base (Sin extra)</option>`;
              rams.forEach(ext => {
                  extrasHtml += `<option value="${ext.id}" ${this.state.selectedExtras.ram===ext.id?'selected':''}>${ext.label} (+${this.config.currency_symbol}${ext.price})</option>`;
              });
              extrasHtml += `</select></div>`;
          }

          if (almacenamientos.length > 0) {
              extrasHtml += `<div class="ceq-form-group" style="margin-bottom:0;"><label class="ceq-form-label">Almacenamiento</label><select class="ceq-form-input" data-action="change-extra" data-type="almacenamiento"><option value="">Base (Sin extra)</option>`;
              almacenamientos.forEach(ext => {
                  extrasHtml += `<option value="${ext.id}" ${this.state.selectedExtras.almacenamiento===ext.id?'selected':''}>${ext.label} (+${this.config.currency_symbol}${ext.price})</option>`;
              });
              extrasHtml += `</select></div>`;
          }
      }

      body.innerHTML = `
      <div class="ceq-layout-split">
          <div class="ceq-layout-left">
              <div class="ceq-box">
                  <div class="ceq-box-title" style="margin-bottom:12px;">Configuración Base</div>
                  <div class="ceq-form-group">
                      <label class="ceq-form-label">Procesador</label>
                      ${procsHtml}
                  </div>
                  <div class="ceq-form-group" style="margin-bottom:0;">
                      <label class="ceq-form-label">Gama / Jornada</label>
                      ${gamasHtml}
                  </div>
                  ${extrasHtml}
              </div>
              <div class="ceq-box ceq-box-row">
                  <div class="ceq-opt-icon" style="border-radius:8px;"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="6" width="16" height="10" rx="1" stroke-width="2"/><path d="M2 18h20" stroke-width="2" stroke-linecap="round"/></svg></div>
                  <div class="ceq-opt-main">
                      <div class="ceq-box-title">Cantidad de laptops</div>
                  </div>
                  <div>
                      <div class="ceq-counter-wrap" style="margin:0;">
                          <button class="ceq-c-btn" style="width:40px;height:40px;font-size:20px;" data-action="qty-minus" data-amount="1">−</button>
                          <div class="ceq-c-val"><strong style="font-size:24px;margin:0 16px;">${this.state.quantity}</strong></div>
                          <button class="ceq-c-btn" style="width:40px;height:40px;font-size:20px;" data-action="qty-plus" data-amount="1">+</button>
                      </div>
                  </div>
              </div>
              <div class="ceq-box">
                  <div class="ceq-box-title" style="margin-bottom:16px;">Período de alquiler</div>
                  <div class="ceq-tabs">
                      <button class="ceq-tab ${this.state.timeUnit==='semanas'?'active':''}" data-action="set-unit" data-value="semanas">Semanas</button>
                      <button class="ceq-tab ${this.state.timeUnit==='meses'?'active':''}" data-action="set-unit" data-value="meses">Meses</button>
                  </div>
                  <div class="ceq-counter-wrap" style="margin-bottom:0;">
                      <button class="ceq-c-btn" data-action="time-minus" data-amount="1">−</button>
                      <div class="ceq-c-val"><strong>${this.state.timeValue}</strong><span>${this.state.timeUnit}</span></div>
                      <button class="ceq-c-btn" data-action="time-plus" data-amount="1">+</button>
                  </div>
              </div>
          </div>
          <div class="ceq-layout-right">
              <div class="ceq-right-card">
                  <div class="ceq-circle">
                      <span class="ceq-circle-lbl">TOTAL ${timeLabel}</span>
                      <span class="ceq-circle-val">${this.config.currency_symbol}${Math.round(tPricePerPeriod)}</span>
                      <span class="ceq-circle-sub" style="font-size:12px; color:#9ca3af;">${this.config.currency_symbol}${Math.round(pBase)} / ${singleUnit} x ${this.state.quantity} ${qtyLabel}</span>
                  </div>
                  <div style="margin-top:16px; font-weight:700; color:#111827; font-size:16px;">
                      Inversión Total (${this.state.timeValue} ${this.state.timeUnit}): <br>
                      <span style="color:#ea580c;">${this.config.currency_symbol}${Math.round(finalPriceAbsolute)}</span>
                  </div>
                  <button class="ceq-btn-primary" style="width:100%; margin-top:24px;" data-action="open-modal">Solicitar Cotización</button>
              </div>
          </div>
      </div>`;
      return;
    }

    // Paso 3
    if (this.state.step === 3) {
      var proc = this.config.processors.find(p => p.id === this.state.processorId);
      
      body.innerHTML = `
        <div class="ceq-layout-split">
            <div class="ceq-layout-left">
                <div class="ceq-box ceq-box-base">
                    <div class="ceq-box-eyebrow">Tu equipo base incluye</div>
                    <div class="ceq-box-title">${proc ? proc.label : ''} + 16 GB RAM + 512 GB SSD</div>
                    <div class="ceq-box-desc">Puedes añadir extras más adelante si deseas.</div>
                </div>
                
                <div class="ceq-box ceq-box-row">
                    <div class="ceq-opt-icon" style="border-radius:8px;"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="6" width="16" height="10" rx="1" stroke-width="2"/><path d="M2 18h20" stroke-width="2" stroke-linecap="round"/></svg></div>
                    <div class="ceq-opt-main">
                        <div class="ceq-box-title">Cantidad de laptops</div>
                        <div class="ceq-box-desc">Unidades a contratar</div>
                    </div>
                    <div>
                        <div class="ceq-counter-wrap" style="margin:0;">
                            <button class="ceq-c-btn" style="width:40px;height:40px;font-size:20px;" data-action="qty-minus" data-amount="1">−</button>
                            <div class="ceq-c-val"><strong style="font-size:24px;margin:0 16px;">${this.state.quantity}</strong></div>
                            <button class="ceq-c-btn" style="width:40px;height:40px;font-size:20px;" data-action="qty-plus" data-amount="1">+</button>
                        </div>
                        <div class="ceq-c-skip" style="margin:4px 0 0; max-width:130px;">
                            <button data-action="qty-minus" data-amount="10">-10</button>
                            <button data-action="qty-plus" data-amount="10">+10</button>
                        </div>
                    </div>
                </div>

                <div class="ceq-box">
                    <div class="ceq-box-title" style="margin-bottom:16px;">Período de alquiler</div>
                    <div class="ceq-tabs">
                        <button class="ceq-tab ${this.state.timeUnit==='semanas'?'active':''}" data-action="set-unit" data-value="semanas">Semanas</button>
                        <button class="ceq-tab ${this.state.timeUnit==='meses'?'active':''}" data-action="set-unit" data-value="meses">Meses</button>
                    </div>
                    <div class="ceq-counter-wrap">
                        <button class="ceq-c-btn" data-action="time-minus" data-amount="1">−</button>
                        <div class="ceq-c-val"><strong>${this.state.timeValue}</strong><span>${this.state.timeUnit}</span></div>
                        <button class="ceq-c-btn" data-action="time-plus" data-amount="1">+</button>
                    </div>
                    <div class="ceq-c-skip">
                        <button data-action="time-minus" data-amount="10">-10</button>
                        <button data-action="time-plus" data-amount="10">+10</button>
                    </div>
                    <div class="ceq-alert">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <span>A mayor plazo, tu inversión mensual disminuye.</span>
                    </div>
                </div>
            </div>

            <div class="ceq-layout-right">
                <div class="ceq-right-card">
                    <div class="ceq-circle">
                        <span class="ceq-circle-lbl">TOTAL ${timeLabel}</span>
                        <span class="ceq-circle-val">${this.config.currency_symbol}${Math.round(tPricePerPeriod)}</span>
                        <span class="ceq-circle-sub" style="font-size:12px; color:#9ca3af;">${this.config.currency_symbol}${Math.round(pBase)} / ${singleUnit} x ${this.state.quantity} ${qtyLabel}</span>
                    </div>
                    <div class="ceq-feat-box">
                        <span class="ceq-feat-eye">SISTEMA OPERATIVO</span>
                        <span class="ceq-feat-title">WINDOWS PRO INCLUIDO</span>
                        <span class="ceq-feat-sub">Precios no incluyen IGV</span>
                    </div>
                </div>
            </div>
        </div>`;
      return;
    }

    // Paso 4
    if (this.state.step === 4) {
      body.innerHTML = `
        <div class="ceq-layout-split">
            <div class="ceq-layout-left">
                <div class="ceq-box ceq-box-base" style="border-style:solid;">
                    <div class="ceq-box-eyebrow">INVERSIÓN TOTAL ESTIMADA</div>
                    <div class="ceq-box-title" style="font-size:32px; color:#ea580c; margin:8px 0;">${this.config.currency_symbol}${Math.round(finalPriceAbsolute)}</div>
                    <div class="ceq-box-desc">Por ${this.state.quantity} ${qtyLabel} durante el periodo completo (${this.state.timeValue} ${this.state.timeUnit}).</div>
                    <div class="ceq-box-desc" style="margin-top:8px; font-size:13px; font-weight:600;">(Esto equivale a pagos de ${this.config.currency_symbol}${Math.round(tPricePerPeriod)} ${timeLabel.toLowerCase()})</div>
                </div>
                <div class="ceq-box" style="padding:16px 24px;">
                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f3f4f6;">
                        <span style="color:#6b7280;">Equipos:</span><strong style="color:#111827;">${this.state.quantity} ${qtyLabel}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f3f4f6;">
                        <span style="color:#6b7280;">Tiempo:</span><strong style="color:#111827;">${this.state.timeValue} ${this.state.timeUnit}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:12px 0;">
                        <span style="color:#6b7280;">Costo Unitario:</span><strong style="color:#111827;">${this.config.currency_symbol}${Math.round(pBase)} / ${singleUnit}</strong>
                    </div>
                </div>
            </div>
            <div class="ceq-layout-right">
                <div class="ceq-right-card" style="padding:40px 24px;">
                    <div class="ceq-opt-icon" style="margin:0 auto 20px; background:#fff; color:#10b981; border:2px solid #10b981;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
                    <h3 style="font-size:20px; color:#111827; margin-bottom:12px;">¡Configuración lista!</h3>
                    <p style="color:#6b7280; font-size:15px; margin:0;">El cálculo es estimado. Solicita tu cotización formal ahora mismo.</p>
                </div>
            </div>
        </div>`;
    }
  };

  CotizadorUI.prototype.renderFooter = function () {
    var footer = this.root.querySelector(".ceq-footer");
    
    if (this.state.step === 0) {
        footer.innerHTML = '';
        return;
    }

    var restartBtn = '<button class="ceq-btn-ghost" data-action="restart"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Volver a empezar</button>';
    
    if (this.state.step === 4) {
      footer.innerHTML = restartBtn + '<button class="ceq-btn-primary" data-action="open-modal">Quiero la cotización en mi correo</button>';
      return;
    }
    if (this.state.step === 5) {
      footer.innerHTML = restartBtn + '<div></div>'; 
      return;
    }

    var back = '<button class="ceq-btn-ghost" data-action="back"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Volver</button>';
    footer.innerHTML = back + '<button class="ceq-btn-primary" data-action="next" ' + (this.canContinue()?'':'disabled') + '>' + (this.state.step===3 ? 'Ver mi solución →' : 'Continuar →') + '</button>';
  };

  CotizadorUI.prototype.renderModal = function () {
      var modalRoot = this.root.querySelector(".ceq-modal-root");
      
      if (!this.state.isModalOpen) {
          modalRoot.innerHTML = '';
          return;
      }

      modalRoot.innerHTML = `
        <div class="ceq-modal-overlay">
            <div class="ceq-modal-box">
                <button type="button" class="ceq-modal-close" data-action="close-modal">
                    <svg style="width:20px;height:20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                <h3 class="ceq-modal-title">Recibe tu cotización</h3>
                <p class="ceq-modal-desc">Te enviaremos un PDF formal con todos los detalles.</p>
                
                <form id="ceq-quote-form">
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">RUC *</label>
                        <input type="text" class="ceq-form-input" required placeholder="10... / 20...">
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">Nombre completo *</label>
                        <input type="text" class="ceq-form-input" required placeholder="Juan Pérez">
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">Correo corporativo *</label>
                        <input type="email" class="ceq-form-input" required placeholder="juan@empresa.com">
                        <span class="ceq-form-help">Para enviarte el PDF formal de tu cotización.</span>
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">WhatsApp (Opcional)</label>
                        <input type="tel" class="ceq-form-input" placeholder="+51 999 999 999">
                    </div>
                    <button type="submit" class="ceq-btn-primary ceq-btn-block">
                        <svg style="width:18px;height:18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg> 
                        Enviar cotización
                    </button>
                </form>
            </div>
        </div>
      `;
  };

  CotizadorUI.prototype.getMatchedRule = function() {
    var v = this.state.timeValue, u = this.state.timeUnit, match = null;
    this.config.periods.forEach(p => {
      if(p.unit === u && v >= p.min_value && (p.max_value === "" || v <= parseInt(p.max_value))) match = p;
    });
    return match;
  };

  CotizadorUI.prototype.getExtrasPrice = function () {
    var total = 0;
    var self = this;
    var extRam = self.config.extras.find(function(e){ return e.id === self.state.selectedExtras.ram; });
    var extStorage = self.config.extras.find(function(e){ return e.id === self.state.selectedExtras.almacenamiento; });
    
    if (extRam) total += parseFloat(extRam.price) || 0;
    if (extStorage) total += parseFloat(extStorage.price) || 0;
    
    return total;
  };

  CotizadorUI.prototype.getBasePrice = function () {
    var rule = this.getMatchedRule();
    if (!rule || !this.state.processorId || !this.state.gamaId) return 0;
    var raw = this.config.prices[this.state.processorId]?.[this.state.gamaId]?.[rule.id];
    var base = raw ? parseFloat(raw) : 0;
    return base + this.getExtrasPrice();
  };

  CotizadorUI.prototype.canContinue = function () {
    if (this.state.step === 1) return !!this.state.processorId;
    if (this.state.step === 2) return !!this.state.gamaId;
    if (this.state.step === 3) return !!this.getMatchedRule() && this.getBasePrice() > 0;
    return true;
  };

  CotizadorUI.prototype.normalizeConfig = function (cfg) {
    var r = cfg || {};
    return { currency_symbol: r.currency_symbol || "S/.", texts: r.texts || {}, processors: r.processors || [], gamas: r.gamas || [], periods: r.periods || [], extras: r.extras || [], prices: r.prices || {} };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCotizadores); else initCotizadores();
})();