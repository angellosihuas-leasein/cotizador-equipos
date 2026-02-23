(function () {
  "use strict";

  function initCotizadores() {
    var containers = document.querySelectorAll(".ce-cotizador[data-ce-config]");
    containers.forEach(function (container) {
      var rawConfig = container.getAttribute("data-ce-config");
      if (!rawConfig) {
        return;
      }

      try {
        var config = JSON.parse(rawConfig);
        new CotizadorUI(container, config).mount();
      } catch (error) {
        container.innerHTML = '<p class="ceq-error">No se pudo cargar el cotizador.</p>';
      }
    });
  }

  function CotizadorUI(root, config) {
    this.root = root;
    this.config = this.normalizeConfig(config);
    this.state = {
      step: 1,
      processorId: null,
      gamaId: null,
      periodId: null,
      quantity: 1,
    };
  }

  CotizadorUI.prototype.mount = function () {
    this.root.innerHTML =
      '<div class="ceq-shell">' +
      '<div class="ceq-header"></div>' +
      '<div class="ceq-body"></div>' +
      '<div class="ceq-footer"></div>' +
      "</div>";

    this.bindEvents();
    this.render();
  };

  CotizadorUI.prototype.bindEvents = function () {
    var self = this;

    this.root.addEventListener("click", function (event) {
      var button = event.target.closest("button");
      if (!button) {
        return;
      }

      var action = button.getAttribute("data-action");
      if (!action) {
        return;
      }

      if (action === "next") {
        if (self.canContinue()) {
          self.state.step = Math.min(4, self.state.step + 1);
          self.render();
        }
        return;
      }

      if (action === "back") {
        self.state.step = Math.max(1, self.state.step - 1);
        self.render();
        return;
      }

      if (action === "restart") {
        self.state.step = 1;
        self.state.processorId = null;
        self.state.gamaId = null;
        self.state.periodId = null;
        self.state.quantity = 1;
        self.render();
        return;
      }

      if (action === "select-processor") {
        self.state.processorId = button.getAttribute("data-value");
        self.render();
        return;
      }

      if (action === "select-gama") {
        self.state.gamaId = button.getAttribute("data-value");
        self.render();
        return;
      }

      if (action === "select-period") {
        self.state.periodId = button.getAttribute("data-value");
        self.render();
        return;
      }

      if (action === "qty-minus") {
        self.state.quantity = Math.max(1, self.state.quantity - 1);
        self.renderStepBody();
        self.renderFooter();
        return;
      }

      if (action === "qty-plus") {
        self.state.quantity = Math.min(999, self.state.quantity + 1);
        self.renderStepBody();
        self.renderFooter();
      }
    });
  };

  CotizadorUI.prototype.render = function () {
    this.renderHeader();
    this.renderStepBody();
    this.renderFooter();
  };

  CotizadorUI.prototype.renderHeader = function () {
    var header = this.root.querySelector(".ceq-header");
    var texts = this.config.texts;
    var stepMap = {
      1: {
        eyebrow: texts.step1_eyebrow,
        title: texts.step1_title,
        subtitle: texts.step1_subtitle,
      },
      2: {
        eyebrow: texts.step2_eyebrow,
        title: texts.step2_title,
        subtitle: texts.step2_subtitle,
      },
      3: {
        eyebrow: texts.step3_eyebrow,
        title: texts.step3_title,
        subtitle: texts.step3_subtitle,
      },
      4: {
        eyebrow: texts.step4_eyebrow,
        title: texts.step4_title,
        subtitle: texts.step4_subtitle,
      },
    };

    var current = stepMap[this.state.step];
    header.innerHTML =
      '<p class="ceq-eyebrow">' +
      this.escape(current.eyebrow) +
      "</p>" +
      '<h2 class="ceq-title">' +
      this.escape(current.title) +
      "</h2>" +
      '<p class="ceq-subtitle">' +
      this.escape(current.subtitle) +
      "</p>";
  };

  CotizadorUI.prototype.renderStepBody = function () {
    var body = this.root.querySelector(".ceq-body");

    if (this.state.step === 1) {
      body.innerHTML = this.renderOptionsList(this.config.processors, "select-processor", this.state.processorId);
      return;
    }

    if (this.state.step === 2) {
      body.innerHTML = this.renderOptionsList(this.config.gamas, "select-gama", this.state.gamaId);
      return;
    }

    if (this.state.step === 3) {
      body.innerHTML = this.renderPeriodStep();
      return;
    }

    body.innerHTML = this.renderSummaryStep();
  };

  CotizadorUI.prototype.renderFooter = function () {
    var footer = this.root.querySelector(".ceq-footer");
    var texts = this.config.texts;

    if (this.state.step === 4) {
      footer.innerHTML =
        '<div class="ceq-footer-inner">' +
        '<button type="button" class="ceq-btn ceq-btn-ghost" data-action="back">' +
        this.escape(texts.btn_back) +
        "</button>" +
        '<button type="button" class="ceq-btn ceq-btn-ghost" data-action="restart">' +
        this.escape(texts.btn_restart) +
        "</button>" +
        '<button type="button" class="ceq-btn ceq-btn-primary ceq-btn-wide">' +
        this.escape(texts.btn_request) +
        "</button>" +
        "</div>";
      return;
    }

    var nextLabel = this.state.step === 3 ? texts.btn_finish : texts.btn_next;
    var disabled = this.canContinue() ? "" : " disabled";
    var backButton =
      this.state.step > 1
        ? '<button type="button" class="ceq-btn ceq-btn-ghost" data-action="back">' + this.escape(texts.btn_back) + "</button>"
        : '<span class="ceq-spacer"></span>';

    footer.innerHTML =
      '<div class="ceq-footer-inner">' +
      backButton +
      '<button type="button" class="ceq-btn ceq-btn-primary" data-action="next"' +
      disabled +
      ">" +
      this.escape(nextLabel) +
      "</button>" +
      "</div>";
  };

  CotizadorUI.prototype.renderOptionsList = function (items, actionName, selectedId) {
    var html = '<div class="ceq-options">';

    items.forEach(
      function (item) {
        var selectedClass = item.id === selectedId ? " is-selected" : "";

        html +=
          '<button type="button" class="ceq-option' +
          selectedClass +
          '" data-action="' +
          actionName +
          '" data-value="' +
          this.escape(item.id) +
          '">' +
          '<span class="ceq-option-main">' +
          '<span class="ceq-option-title">' +
          this.escape(item.label) +
          "</span>" +
          '<span class="ceq-option-description">' +
          this.escape(item.description) +
          "</span>" +
          "</span>" +
          '<span class="ceq-option-dot"></span>' +
          "</button>";
      }.bind(this)
    );

    html += "</div>";
    return html;
  };

  CotizadorUI.prototype.renderPeriodStep = function () {
    var texts = this.config.texts;
    var periodCards = this.renderOptionsList(this.config.periods, "select-period", this.state.periodId);
    var price = this.getCurrentPrice();
    var total = price * this.state.quantity;

    return (
      '<div class="ceq-grid">' +
      '<div class="ceq-panel">' +
      "<h3>" +
      this.escape(texts.period_label) +
      "</h3>" +
      periodCards +
      '<div class="ceq-qty">' +
      "<h3>" +
      this.escape(texts.quantity_label) +
      "</h3>" +
      '<div class="ceq-qty-controls">' +
      '<button type="button" class="ceq-qty-btn" data-action="qty-minus">-</button>' +
      '<span class="ceq-qty-value">' +
      this.escape(this.state.quantity) +
      "</span>" +
      '<button type="button" class="ceq-qty-btn" data-action="qty-plus">+</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<aside class="ceq-price-card">' +
      '<p class="ceq-price-label">' +
      this.escape(texts.price_label) +
      "</p>" +
      '<p class="ceq-price-value">' +
      this.escape(this.formatMoney(price)) +
      "</p>" +
      '<p class="ceq-price-note">' +
      this.escape(this.getSelectedPeriodLabel()) +
      "</p>" +
      '<div class="ceq-price-total">Total: ' +
      this.escape(this.formatMoney(total)) +
      "</div>" +
      "</aside>" +
      "</div>"
    );
  };

  CotizadorUI.prototype.renderSummaryStep = function () {
    var processor = this.findById(this.config.processors, this.state.processorId);
    var gama = this.findById(this.config.gamas, this.state.gamaId);
    var period = this.findById(this.config.periods, this.state.periodId);
    var unitPrice = this.getCurrentPrice();
    var total = unitPrice * this.state.quantity;

    return (
      '<div class="ceq-summary">' +
      '<div class="ceq-summary-card">' +
      '<p class="ceq-price-label">' +
      this.escape(this.config.texts.price_label) +
      "</p>" +
      '<p class="ceq-price-value">' +
      this.escape(this.formatMoney(unitPrice)) +
      "</p>" +
      '<p class="ceq-price-note">por laptop</p>' +
      '<dl class="ceq-specs">' +
      "<div><dt>Procesador</dt><dd>" +
      this.escape(processor ? processor.label : "-") +
      "</dd></div>" +
      "<div><dt>Gama</dt><dd>" +
      this.escape(gama ? gama.label : "-") +
      "</dd></div>" +
      "<div><dt>Periodo</dt><dd>" +
      this.escape(period ? period.label : "-") +
      "</dd></div>" +
      "<div><dt>Unidades</dt><dd>" +
      this.escape(this.state.quantity) +
      "</dd></div>" +
      '<div><dt>Total mensual</dt><dd class="ceq-total">' +
      this.escape(this.formatMoney(total)) +
      "</dd></div>" +
      "</dl>" +
      "</div>" +
      '<div class="ceq-summary-side">' +
      '<div class="ceq-badge">Configuracion lista</div>' +
      '<p>Este resultado usa la matriz de precios configurada en el panel del plugin.</p>' +
      "</div>" +
      "</div>"
    );
  };

  CotizadorUI.prototype.canContinue = function () {
    if (this.state.step === 1) {
      return Boolean(this.state.processorId);
    }
    if (this.state.step === 2) {
      return Boolean(this.state.gamaId);
    }
    if (this.state.step === 3) {
      return Boolean(this.state.periodId);
    }
    return true;
  };

  CotizadorUI.prototype.getCurrentPrice = function () {
    if (!this.state.processorId || !this.state.gamaId || !this.state.periodId) {
      return 0;
    }

    var pricesByProcessor = this.config.prices[this.state.processorId];
    if (!pricesByProcessor) {
      return 0;
    }

    var pricesByGama = pricesByProcessor[this.state.gamaId];
    if (!pricesByGama) {
      return 0;
    }

    var rawPrice = pricesByGama[this.state.periodId];
    if (typeof rawPrice === "undefined" || rawPrice === "") {
      return 0;
    }

    var numericPrice = parseFloat(rawPrice);
    if (isNaN(numericPrice)) {
      return 0;
    }

    return numericPrice;
  };

  CotizadorUI.prototype.getSelectedPeriodLabel = function () {
    var period = this.findById(this.config.periods, this.state.periodId);
    return period ? period.label : "Selecciona un periodo";
  };

  CotizadorUI.prototype.findById = function (items, id) {
    return items.find(function (item) {
      return item.id === id;
    });
  };

  CotizadorUI.prototype.formatMoney = function (amount) {
    var formatted = Number(amount).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return this.config.currency_symbol + formatted;
  };

  CotizadorUI.prototype.normalizeConfig = function (config) {
    var raw = config || {};
    return {
      currency_symbol: raw.currency_symbol || "S/",
      texts: raw.texts || {},
      processors: Array.isArray(raw.processors) ? raw.processors : [],
      gamas: Array.isArray(raw.gamas) ? raw.gamas : [],
      periods: Array.isArray(raw.periods) ? raw.periods : [],
      prices: raw.prices || {},
    };
  };

  CotizadorUI.prototype.escape = function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCotizadores);
  } else {
    initCotizadores();
  }
})();
