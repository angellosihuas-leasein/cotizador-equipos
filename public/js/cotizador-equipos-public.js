(function () {
  "use strict";

  function initCotizadores() {
    var containers = document.querySelectorAll(".ce-cotizador[data-ce-config]");
    containers.forEach(function (container) {
      if (!container.getAttribute("data-ce-config")) return;
      try {
        new CotizadorUI(container, JSON.parse(container.getAttribute("data-ce-config"))).mount();
      } catch (e) { console.error(e); }
    });
  }

  function CotizadorUI(root, config) {
    this.root = root;
    this.config = this.normalizeConfig(config);
    this.state = {
      step: 1,
      processorId: null,
      gamaId: null,
      periodId: this.config.periods[0] ? this.config.periods[0].id : null,
      periodQty: 1, // Contador de tiempo (ej: 5 meses)
      quantity: 1,  // Contador de laptops
    };
  }

  CotizadorUI.prototype.mount = function () {
    this.root.innerHTML = '<div class="ceq-shell"><div class="ceq-header"></div><div class="ceq-body"></div><div class="ceq-footer"></div></div>';
    this.bindEvents();
    this.render();
  };

  CotizadorUI.prototype.bindEvents = function () {
    var self = this;
    this.root.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var action = btn.getAttribute("data-action");
      
      if (action === "next" && self.canContinue()) { self.state.step++; self.render(); }
      if (action === "back") { self.state.step--; self.render(); }
      if (action === "restart") { self.state.step = 1; self.state.quantity = 1; self.state.periodQty = 1; self.render(); }
      
      if (action === "select-processor") { self.state.processorId = btn.getAttribute("data-value"); self.render(); }
      if (action === "select-gama") { self.state.gamaId = btn.getAttribute("data-value"); self.render(); }
      if (action === "select-period-unit") { self.state.periodId = btn.getAttribute("data-value"); self.renderStepBody(); self.renderFooter(); }
      
      if (action === "qty-minus") { self.state.quantity = Math.max(1, self.state.quantity - 1); self.renderStepBody(); }
      if (action === "qty-plus") { self.state.quantity = Math.min(999, self.state.quantity + 1); self.renderStepBody(); }
      
      if (action === "time-minus") { self.state.periodQty = Math.max(1, self.state.periodQty - 1); self.renderStepBody(); }
      if (action === "time-plus") { self.state.periodQty = Math.min(999, self.state.periodQty + 1); self.renderStepBody(); }
    });
  };

  CotizadorUI.prototype.render = function () {
    this.renderHeader();
    this.renderStepBody();
    this.renderFooter();
  };

  CotizadorUI.prototype.renderHeader = function () {
    var texts = this.config.texts;
    var stepMap = {
      1: { eyebrow: texts.step1_eyebrow, title: texts.step1_title, subtitle: texts.step1_subtitle },
      2: { eyebrow: texts.step2_eyebrow, title: texts.step2_title, subtitle: texts.step2_subtitle },
      3: { eyebrow: texts.step3_eyebrow, title: texts.step3_title, subtitle: texts.step3_subtitle },
      4: { eyebrow: texts.step4_eyebrow, title: texts.step4_title, subtitle: texts.step4_subtitle },
    };
    var c = stepMap[this.state.step];
    this.root.querySelector(".ceq-header").innerHTML = 
      '<p class="ceq-eyebrow">' + c.eyebrow + '</p><h2 class="ceq-title">' + c.title + '</h2><p class="ceq-subtitle">' + c.subtitle + '</p>';
  };

  CotizadorUI.prototype.getIcon = function(step, index) {
      if(step === 1) {
          if(index === 0) return '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><path d="M8 21h8m-4-4v4"></path></svg>';
          if(index === 1) return '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"></path></svg>';
          return '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>';
      } else {
          if(index === 0) return '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="M16 2v4M8 2v4M3 10h18"></path></svg>';
          if(index === 1) return '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
          return '<svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
      }
  };

  CotizadorUI.prototype.renderStepBody = function () {
    var body = this.root.querySelector(".ceq-body");
    var self = this;

    if (this.state.step === 1 || this.state.step === 2) {
      var items = this.state.step === 1 ? this.config.processors : this.config.gamas;
      var selectedId = this.state.step === 1 ? this.state.processorId : this.state.gamaId;
      var action = this.state.step === 1 ? "select-processor" : "select-gama";
      
      var html = '<div class="ceq-options">';
      items.forEach(function (item, i) {
        var active = item.id === selectedId ? " is-selected" : "";
        var label = item.front_label || item.label;
        html += '<button type="button" class="ceq-option' + active + '" data-action="' + action + '" data-value="' + item.id + '">' +
                '<div class="ceq-option-icon">' + self.getIcon(self.state.step, i) + '</div>' +
                '<div class="ceq-option-main"><span class="ceq-option-title">' + label + '</span>' +
                '<span class="ceq-option-description">' + item.description + '</span></div>' +
                '<div class="ceq-option-dot"></div></button>';
      });
      body.innerHTML = html + '</div>';
      return;
    }

    if (this.state.step === 3) {
      var basePrice = this.getCurrentBasePrice();
      var totalMonthly = basePrice * this.state.periodQty * this.state.quantity;
      var period = this.config.periods.find(p => p.id === this.state.periodId);
      var pLabel = period ? (period.front_label || period.label) : '';

      var unitsHtml = '<div class="ceq-period-opts">';
      this.config.periods.forEach(function(p){
          var active = p.id === self.state.periodId ? ' is-active' : '';
          unitsHtml += '<button type="button" class="ceq-period-btn'+active+'" data-action="select-period-unit" data-value="'+p.id+'">'+(p.front_label || p.label)+'</button>';
      });
      unitsHtml += '</div>';

      body.innerHTML = 
        '<div class="ceq-grid"><div class="ceq-panel">' +
        '<h3>' + this.config.texts.period_label + '</h3>' + unitsHtml +
        '<div class="ceq-qty-box"><h3>Cantidad de '+pLabel.toLowerCase()+'</h3><div class="ceq-qty-controls">' +
        '<button type="button" class="ceq-qty-btn" data-action="time-minus">-</button>' +
        '<span class="ceq-qty-value">' + this.state.periodQty + '</span>' +
        '<button type="button" class="ceq-qty-btn" data-action="time-plus">+</button>' +
        '</div></div>' +
        '<div class="ceq-qty-box"><h3>' + this.config.texts.quantity_label + '</h3><div class="ceq-qty-controls">' +
        '<button type="button" class="ceq-qty-btn" data-action="qty-minus">-</button>' +
        '<span class="ceq-qty-value">' + this.state.quantity + '</span>' +
        '<button type="button" class="ceq-qty-btn" data-action="qty-plus">+</button>' +
        '</div></div>' +
        '</div>' +
        '<div class="ceq-price-card"><p class="ceq-price-label">' + this.config.texts.price_label + '</p>' +
        '<p class="ceq-price-value">' + this.formatMoney(basePrice) + '</p>' +
        '<p class="ceq-price-note">Precio base por 1 ' + (period ? period.label.toLowerCase() : '') + '</p>' +
        '<div class="ceq-price-total">Total estimado: ' + this.formatMoney(totalMonthly) + '</div>' +
        '</div></div>';
      return;
    }

    // Step 4: Summary
    var proc = this.config.processors.find(p => p.id === this.state.processorId);
    var gama = this.config.gamas.find(g => g.id === this.state.gamaId);
    var per = this.config.periods.find(p => p.id === this.state.periodId);
    var tPrice = this.getCurrentBasePrice() * this.state.periodQty * this.state.quantity;
    
    body.innerHTML = 
      '<div class="ceq-grid"><div class="ceq-panel"><p class="ceq-price-label">TOTAL COTIZADO</p>' +
      '<p class="ceq-price-value" style="color:var(--ce-accent)">' + this.formatMoney(tPrice) + '</p>' +
      '<dl class="ceq-specs">' +
      '<div><dt>Aplicación</dt><dd>' + (proc ? (proc.front_label||proc.label) : '-') + '</dd></div>' +
      '<div><dt>Jornada</dt><dd>' + (gama ? (gama.front_label||gama.label) : '-') + '</dd></div>' +
      '<div><dt>Tiempo</dt><dd>' + this.state.periodQty + ' ' + (per ? (per.front_label||per.label).toLowerCase() : '') + '</dd></div>' +
      '<div><dt>Equipos</dt><dd>' + this.state.quantity + '</dd></div></dl></div>' +
      '<div class="ceq-panel" style="background:#fff5f2; border-color:#f9531633; display:flex; flex-direction:column; justify-content:center;">' +
      '<h3 style="color:var(--ce-accent)">Configuración confirmada</h3>' +
      '<p style="color:#4b5563; font-size:16px; line-height:1.5;">Tu requerimiento ha sido calculado. Solicita conversar con un especialista para formalizar tu cotización.</p>' +
      '</div></div>';
  };

  CotizadorUI.prototype.renderFooter = function () {
    var footer = this.root.querySelector(".ceq-footer");
    var t = this.config.texts;
    if (this.state.step === 4) {
      footer.innerHTML = '<div class="ceq-footer-inner"><button class="ceq-btn ceq-btn-ghost" data-action="restart">' + t.btn_restart + '</button><button class="ceq-btn ceq-btn-primary" data-action="next">' + t.btn_request + '</button></div>';
      return;
    }
    var backBtn = this.state.step > 1 ? '<button class="ceq-btn ceq-btn-ghost" data-action="back">' + t.btn_back + '</button>' : '<div></div>';
    var nextLabel = this.state.step === 3 ? t.btn_finish : t.btn_next;
    footer.innerHTML = '<div class="ceq-footer-inner">' + backBtn + '<button class="ceq-btn ceq-btn-primary" data-action="next" ' + (this.canContinue()?'':'disabled') + '>' + nextLabel + '</button></div>';
  };

  CotizadorUI.prototype.canContinue = function () {
    if (this.state.step === 1) return !!this.state.processorId;
    if (this.state.step === 2) return !!this.state.gamaId;
    return true;
  };

  CotizadorUI.prototype.getCurrentBasePrice = function () {
    if (!this.state.processorId || !this.state.gamaId || !this.state.periodId) return 0;
    var p = this.config.prices[this.state.processorId]?.[this.state.gamaId]?.[this.state.periodId];
    return p ? parseFloat(p) : 0;
  };

  CotizadorUI.prototype.formatMoney = function (amt) {
    return this.config.currency_symbol + Number(amt).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  CotizadorUI.prototype.normalizeConfig = function (cfg) {
    var r = cfg || {};
    return { currency_symbol: r.currency_symbol || "S/", texts: r.texts || {}, processors: r.processors || [], gamas: r.gamas || [], periods: r.periods || [], prices: r.prices || {} };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCotizadores);
  else initCotizadores();
})();