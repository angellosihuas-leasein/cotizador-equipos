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
        step: 1, 
        processorId: null, 
        gamaId: null, 
        timeUnit: 'meses', 
        timeValue: 1, 
        quantity: 1,
        selectedExtras: [],
        isModalOpen: false,
        isManualMode: false
    };
  }

  CotizadorUI.prototype.mount = function () {
    this.root.innerHTML = '<div class="ce-cotizador-wrapper"><div class="ceq-stage"><div class="ceq-header"></div><div class="ceq-body"></div><div class="ceq-footer"></div></div><div class="ceq-modal-root"></div></div>';
    this.bindEvents();
    this.render();
  };

  CotizadorUI.prototype.bindEvents = function () {
    var self = this;
    
    // Delegación de clics
    this.root.addEventListener("click", function (e) {
      // Evitar que cierre si el click es dentro del popup. Cerrar si es en el overlay.
      if (e.target.classList.contains("ceq-modal-overlay")) {
          self.closeModal();
          return;
      }

      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      
      if (action === "next" && self.canContinue()) self.goToStep(self.state.step + 1);
      if (action === "back") self.goToStep(self.state.step - 1);
      if (action === "restart") { self.state.step = 1; self.state.quantity = 1; self.state.timeValue = 1; self.state.selectedExtras = []; self.state.isManualMode = false; self.goToStep(1); }
      
      if (action === "select-processor") { self.state.processorId = btn.getAttribute("data-value"); self.renderBody(); self.renderFooter(); }
      if (action === "select-gama") { self.state.gamaId = btn.getAttribute("data-value"); self.renderBody(); self.renderFooter(); }
      
      if (action === "set-unit") { self.state.timeUnit = btn.getAttribute("data-value"); self.state.timeValue = 1; self.renderBody(); self.renderFooter(); }
      
      if (action === "time-minus") { self.state.timeValue = Math.max(1, self.state.timeValue - parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }
      if (action === "time-plus") { self.state.timeValue = Math.min(999, self.state.timeValue + parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }
      
      if (action === "qty-minus") { self.state.quantity = Math.max(1, self.state.quantity - parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }
      if (action === "qty-plus") { self.state.quantity = Math.min(999, self.state.quantity + parseInt(btn.getAttribute("data-amount"))); self.renderBody(); self.renderFooter(); }

      if (action === "go-manual") {
          self.state.isManualMode = true;
          if(!self.state.processorId && self.config.processors.length) self.state.processorId = self.config.processors[0].id;
          if(!self.state.gamaId && self.config.gamas.length) self.state.gamaId = self.config.gamas[0].id;
          self.goToStep(5); // Paso manual
      }

      // Acciones del Modal
      if (action === "open-modal") { self.state.isModalOpen = true; self.renderModal(); }
      if (action === "close-modal") { self.closeModal(); }
    });

    // Delegación de cambios (para dropdowns y checkboxes del modo manual)
    this.root.addEventListener("change", function(e) {
        var action = e.target.getAttribute("data-action");
        if (action === "change-proc") { self.state.processorId = e.target.value; self.renderBody(); self.renderFooter(); }
        if (action === "change-gama") { self.state.gamaId = e.target.value; self.renderBody(); self.renderFooter(); }
        if (action === "toggle-extra-input") {
            var extId = e.target.value;
            var idx = self.state.selectedExtras.indexOf(extId);
            if (e.target.checked && idx === -1) self.state.selectedExtras.push(extId);
            else if (!e.target.checked && idx > -1) self.state.selectedExtras.splice(idx, 1);
            self.renderBody(); self.renderFooter();
        }
    });

    // Envío del formulario del modal
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
    }, 280); // Transición alineada a CSS
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
    var t = this.config.texts;
    var st = {
      1: { eye: 'PASO 1 DE 4', title: t.step1_title, sub: 'Selecciona la potencia base para tu equipo.' },
      2: { eye: 'PASO 2 DE 4', title: t.step2_title, sub: 'El chasis determina la durabilidad, ventilación y portabilidad del equipo.' },
      3: { eye: 'PASO 3 DE 4', title: 'Configura tu requerimiento', sub: 'Calculamos el precio exacto basado en el tiempo de alquiler.' },
      4: { eye: 'PASO 4 DE 4', title: '¡Excelente elección!', sub: 'Revisa el resumen y obtén tu cotización formal.' },
      5: { eye: 'MODO MANUAL', title: 'Configuración Rápida', sub: 'Personaliza tu equipo, extras y tiempo al instante.' } // Nuevo Paso
    }[this.state.step];
    
    this.root.querySelector(".ceq-header").innerHTML = 
      '<span class="ceq-eyebrow">' + st.eye + '</span><h2 class="ceq-title">' + st.title + '</h2><p class="ceq-subtitle">' + st.sub + '</p>';
  };

  CotizadorUI.prototype.getIcon = function(step, i) {
    var s1 = ['<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>', '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" stroke-width="2" stroke-linecap="round"/></svg>'];
    var s2 = ['<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="6" width="18" height="12" rx="2" stroke-width="2"/><path d="M8 21h8m-4-3v3" stroke-width="2" stroke-linecap="round"/></svg>', '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="4" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke-width="2"/></svg>', '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 2l3 6 6 .5-4.5 4.5 1 6-5.5-3-5.5 3 1-6L3 8.5l6-.5z" stroke-width="2" stroke-linejoin="round"/></svg>'];
    return (step === 1 ? s1[i % s1.length] : s2[i % s2.length]);
  };

  CotizadorUI.prototype.getRadioSvg = function(isSelected) {
      if(isSelected) return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#f97316" stroke-width="2" fill="#f97316"/><circle cx="12" cy="12" r="4" fill="white"/></svg>';
      return '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#e5e7eb" stroke-width="2" fill="white"/></svg>';
  }

  CotizadorUI.prototype.renderBody = function () {
    var body = this.root.querySelector(".ceq-body");
    var self = this;

    // Pasos clásicos 1 y 2
    if (this.state.step === 1 || this.state.step === 2) {
      var items = this.state.step === 1 ? this.config.processors : this.config.gamas;
      var selectedId = this.state.step === 1 ? this.state.processorId : this.state.gamaId;
      var action = this.state.step === 1 ? "select-processor" : "select-gama";
      
      var waBtn = this.state.step === 1 ? 
        '<a class="ceq-whatsapp-cta" href="'+this.config.texts.whatsapp_url+'" target="_blank">' +
        '<span class="ceq-wa-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></span>' +
        '<span class="ceq-wa-text"><span class="ceq-wa-title">Quiero hablar con un especialista ahora</span><span class="ceq-wa-desc">Si prefieres, te atendemos por WhatsApp y armamos la cotización contigo.</span></span>' +
        '<span style="color:#f97316; font-size:24px; font-weight:300;">→</span></a>' : '';

      var manualLink = this.state.step === 1 ? '<div style="text-align:center; margin-top:24px;"><button type="button" class="ceq-btn-ghost" style="color:#f97316; font-size:15px; text-decoration:underline;" data-action="go-manual">' + (this.config.texts.manual_link || '¿Ya conoces lo que quieres? Configúralo manualmente') + '</button></div>' : '';

      var html = '<div class="ceq-options">';
      items.forEach(function (item, i) {
        var isSelected = item.id === selectedId;
        var displayTitle = (item.front_label && item.front_label.trim() !== "") ? item.front_label : item.label;

        html += '<button type="button" class="ceq-option ' + (isSelected ? "is-selected" : "") + '" data-action="' + action + '" data-value="' + item.id + '">' +
                '<span class="ceq-opt-icon">' + self.getIcon(self.state.step, i) + '</span>' +
                '<span class="ceq-opt-main"><span class="ceq-opt-title">' + displayTitle + '</span><span class="ceq-opt-desc">' + item.description + '</span></span>' +
                '<span class="ceq-opt-radio">' + self.getRadioSvg(isSelected) + '</span></button>';
      });
      body.innerHTML = html + '</div>' + manualLink + waBtn;
      return;
    }

    // Paso 5: Modo Manual con Extras
    if (this.state.step === 5) {
      var pBaseManual = this.getBasePrice();
      var tPriceManual = pBaseManual * this.state.quantity * this.state.timeValue;
      
      var procsHtml = '<select class="ceq-form-input" data-action="change-proc">';
      this.config.processors.forEach(p => { procsHtml += `<option value="${p.id}" ${p.id===this.state.processorId?'selected':''}>${p.label}</option>`; });
      procsHtml += '</select>';

      var gamasHtml = '<select class="ceq-form-input" data-action="change-gama">';
      this.config.gamas.forEach(g => { gamasHtml += `<option value="${g.id}" ${g.id===this.state.gamaId?'selected':''}>${g.label}</option>`; });
      gamasHtml += '</select>';

      var extrasHtml = '';
      if (this.config.extras && this.config.extras.length > 0) {
          extrasHtml = '<div class="ceq-box-title" style="margin-top:24px; margin-bottom:12px;">Extras y Adicionales</div><div style="display:grid; gap:12px;">';
          this.config.extras.forEach(ext => {
              var isChecked = this.state.selectedExtras.includes(ext.id);
              extrasHtml += `
              <label class="ceq-option ${isChecked ? 'is-selected' : ''}" style="padding:16px; cursor:pointer;">
                  <input type="checkbox" style="display:none;" data-action="toggle-extra-input" value="${ext.id}" ${isChecked ? 'checked' : ''}>
                  <span class="ceq-opt-main" style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                      <span style="font-weight:600; font-size:15px; color:#111827;">${ext.label}</span>
                      <span style="color:#f97316; font-weight:700; font-size:14px;">+${this.config.currency_symbol}${ext.price}</span>
                  </span>
                  <span class="ceq-opt-radio" style="margin-left:16px;">${this.getRadioSvg(isChecked)}</span>
              </label>`;
          });
          extrasHtml += '</div>';
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
                      <span class="ceq-circle-lbl">CUOTA ${this.state.timeUnit.toUpperCase()}</span>
                      <span class="ceq-circle-val">${this.config.currency_symbol}${Math.round(pBaseManual)}</span>
                      <span class="ceq-circle-sub">/ ${this.state.timeUnit.replace(/s$/,'')} • laptop</span>
                  </div>
                  <div style="margin-top:16px; font-weight:700; color:#111827; font-size:16px;">
                      Inversión Total: <span style="color:#f97316;">${this.config.currency_symbol}${Math.round(tPriceManual)}</span>
                  </div>
                  <button class="ceq-btn-primary" style="width:100%; margin-top:24px;" data-action="open-modal">Solicitar Cotización</button>
              </div>
          </div>
      </div>`;
      return;
    }

    // Paso 3
    if (this.state.step === 3) {
      var pBase = this.getBasePrice();
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
                        <span class="ceq-circle-lbl">CUOTA ${this.state.timeUnit.toUpperCase()}</span>
                        <span class="ceq-circle-val">${this.config.currency_symbol}${Math.round(pBase)}</span>
                        <span class="ceq-circle-sub">/ ${this.state.timeUnit.replace(/s$/,'')} • laptop</span>
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
      var finalPrice = this.getBasePrice() * this.state.quantity * this.state.timeValue;
      body.innerHTML = `
        <div class="ceq-layout-split">
            <div class="ceq-layout-left">
                <div class="ceq-box ceq-box-base" style="border-style:solid;">
                    <div class="ceq-box-eyebrow">RESUMEN DE COTIZACIÓN</div>
                    <div class="ceq-box-title" style="font-size:32px; color:#f97316; margin:8px 0;">${this.config.currency_symbol}${Math.round(finalPrice)}</div>
                    <div class="ceq-box-desc">Costo total estimado por el lote completo.</div>
                </div>
                <div class="ceq-box" style="padding:16px 24px;">
                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f3f4f6;">
                        <span style="color:#6b7280;">Equipos:</span><strong style="color:#111827;">${this.state.quantity} unidades</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f3f4f6;">
                        <span style="color:#6b7280;">Tiempo:</span><strong style="color:#111827;">${this.state.timeValue} ${this.state.timeUnit}</strong>
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
    var restartBtn = '<button class="ceq-btn-ghost" data-action="restart"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Volver a empezar</button>';
    
    if (this.state.step === 4) {
      footer.innerHTML = restartBtn + '<button class="ceq-btn-primary" data-action="open-modal">Quiero la cotización en mi correo</button>';
      return;
    }
    if (this.state.step === 5) {
      footer.innerHTML = restartBtn + '<div></div>'; // En el modo manual el botón está en la card derecha
      return;
    }

    var back = this.state.step > 1 ? '<button class="ceq-btn-ghost" data-action="back"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Volver</button>' : '<div></div>';
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
    this.state.selectedExtras.forEach(function(extId) {
        var extra = self.config.extras.find(function(e){ return e.id === extId; });
        if (extra) total += parseFloat(extra.price) || 0;
    });
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