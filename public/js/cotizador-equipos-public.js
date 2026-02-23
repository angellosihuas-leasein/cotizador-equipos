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
      timeUnit: null,
      timeValue: 1,
      quantity: 1,
      showQuick: false,
      isTransitioning: false,
    };
  }

  CotizadorUI.prototype.mount = function () {
    this.root.innerHTML =
      '<div class="ceq-shell">' +
      '<div class="ceq-stage">' +
      '<div class="ceq-header"></div>' +
      '<div class="ceq-body"></div>' +
      '<div class="ceq-footer"></div>' +
      "</div>" +
      "</div>";

    this.ensureState();
    this.bindEvents();
    this.render();
  };

  CotizadorUI.prototype.bindEvents = function () {
    var self = this;

    this.root.addEventListener("click", function (event) {
      var button = event.target.closest("[data-action]");
      if (!button) {
        return;
      }

      var action = button.getAttribute("data-action");

      if (action === "next") {
        if (!self.canContinue()) {
          return;
        }
        self.goToStep(Math.min(4, self.state.step + 1));
        return;
      }

      if (action === "back") {
        self.goToStep(Math.max(1, self.state.step - 1));
        return;
      }

      if (action === "restart") {
        self.state.step = 1;
        self.state.processorId = null;
        self.state.gamaId = null;
        self.state.periodId = null;
        self.state.timeValue = 1;
        self.state.quantity = 1;
        self.state.showQuick = false;
        self.ensureState();
        self.render();
        return;
      }

      if (action === "select-processor") {
        self.state.processorId = button.getAttribute("data-value");
        self.renderStepBody();
        self.renderFooter();
        return;
      }

      if (action === "select-gama") {
        self.state.gamaId = button.getAttribute("data-value");
        self.renderStepBody();
        self.renderFooter();
        return;
      }

      if (action === "set-unit") {
        self.state.timeUnit = button.getAttribute("data-value");
        self.updateMatchedPeriod();
        self.renderStepBody();
        self.renderFooter();
        return;
      }

      if (action === "time-minus") {
        self.state.timeValue = Math.max(1, self.state.timeValue - 1);
        self.updateMatchedPeriod();
        self.renderStepBody();
        self.renderFooter();
        return;
      }

      if (action === "time-plus") {
        self.state.timeValue = Math.min(999, self.state.timeValue + 1);
        self.updateMatchedPeriod();
        self.renderStepBody();
        self.renderFooter();
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
        return;
      }

      if (action === "toggle-quick") {
        self.state.showQuick = !self.state.showQuick;
        self.renderStepBody();
        return;
      }

      if (action === "quick-apply") {
        self.updateMatchedPeriod();
        if (self.state.processorId && self.state.gamaId && self.state.periodId) {
          self.goToStep(4);
        } else {
          self.goToStep(3);
        }
      }
    });

    this.root.addEventListener("change", function (event) {
      var target = event.target;
      var quickField = target.getAttribute("data-quick-field");
      if (!quickField) {
        return;
      }

      if (quickField === "processor") {
        self.state.processorId = target.value || null;
      } else if (quickField === "gama") {
        self.state.gamaId = target.value || null;
      } else if (quickField === "unit") {
        self.state.timeUnit = target.value || null;
      } else if (quickField === "quantity") {
        self.state.quantity = self.clampInt(target.value, 1, 999, 1);
      } else if (quickField === "time") {
        self.state.timeValue = self.clampInt(target.value, 1, 999, 1);
      }

      self.updateMatchedPeriod();
      self.renderStepBody();
      self.renderFooter();
    });

    this.root.addEventListener("input", function (event) {
      var target = event.target;
      var field = target.getAttribute("data-field");
      if (!field) {
        return;
      }

      if (field === "time-value") {
        self.state.timeValue = self.clampInt(target.value, 1, 999, 1);
      } else if (field === "quantity-value") {
        self.state.quantity = self.clampInt(target.value, 1, 999, 1);
      }

      self.updateMatchedPeriod();
      self.renderStepBody();
      self.renderFooter();
    });
  };

  CotizadorUI.prototype.goToStep = function (nextStep) {
    if (this.state.isTransitioning || nextStep === this.state.step) {
      return;
    }

    this.state.isTransitioning = true;
    var stage = this.root.querySelector(".ceq-stage");
    var self = this;

    stage.classList.add("is-leaving");

    window.setTimeout(function () {
      self.state.step = nextStep;
      self.ensureState();
      self.render();
      stage.classList.remove("is-leaving");
      stage.classList.add("is-entering");
      window.requestAnimationFrame(function () {
        stage.classList.remove("is-entering");
      });
      self.state.isTransitioning = false;
    }, 170);
  };

  CotizadorUI.prototype.render = function () {
    this.ensureState();
    this.renderHeader();
    this.renderStepBody();
    this.renderFooter();
  };

  CotizadorUI.prototype.ensureState = function () {
    if (!this.config.processors.find(this.byId(this.state.processorId))) {
      this.state.processorId = null;
    }

    if (!this.config.gamas.find(this.byId(this.state.gamaId))) {
      this.state.gamaId = null;
    }

    var units = this.getUnits();
    if (!units.length) {
      this.state.timeUnit = null;
    } else if (!units.includes(this.state.timeUnit)) {
      this.state.timeUnit = units[0];
    }

    this.state.timeValue = this.clampInt(this.state.timeValue, 1, 999, 1);
    this.state.quantity = this.clampInt(this.state.quantity, 1, 999, 1);
    this.updateMatchedPeriod();
  };

  CotizadorUI.prototype.renderHeader = function () {
    var header = this.root.querySelector(".ceq-header");
    var texts = this.config.texts;

    var stepMap = {
      1: { eyebrow: texts.step1_eyebrow, title: texts.step1_title, subtitle: texts.step1_subtitle },
      2: { eyebrow: texts.step2_eyebrow, title: texts.step2_title, subtitle: texts.step2_subtitle },
      3: { eyebrow: texts.step3_eyebrow, title: texts.step3_title, subtitle: texts.step3_subtitle },
      4: { eyebrow: texts.step4_eyebrow, title: texts.step4_title, subtitle: texts.step4_subtitle },
    };

    var current = stepMap[this.state.step];
    header.innerHTML =
      '<p class="ceq-eyebrow">' + this.escape(current.eyebrow) + "</p>" +
      '<h2 class="ceq-title">' + this.escape(current.title) + "</h2>" +
      '<p class="ceq-subtitle">' + this.escape(current.subtitle) + "</p>";
  };

  CotizadorUI.prototype.renderStepBody = function () {
    var body = this.root.querySelector(".ceq-body");

    if (this.state.step === 1) {
      body.innerHTML = this.renderStepOne();
      return;
    }

    if (this.state.step === 2) {
      body.innerHTML = this.renderOptionsList(this.config.gamas, "select-gama", this.state.gamaId, "gama");
      body.innerHTML += this.renderQuickAccess();
      return;
    }

    if (this.state.step === 3) {
      body.innerHTML = this.renderPeriodConfigurator();
      body.innerHTML += this.renderQuickAccess();
      return;
    }

    body.innerHTML = this.renderSummary();
  };

  CotizadorUI.prototype.renderFooter = function () {
    var footer = this.root.querySelector(".ceq-footer");
    var t = this.config.texts;

    if (this.state.step === 4) {
      footer.innerHTML =
        '<div class="ceq-footer-inner">' +
        '<button type="button" class="ceq-btn ceq-btn-ghost" data-action="back">' + this.escape(t.btn_back) + "</button>" +
        '<button type="button" class="ceq-btn ceq-btn-ghost" data-action="restart">' + this.escape(t.btn_restart) + "</button>" +
        '<a class="ceq-btn ceq-btn-primary ceq-btn-wide" href="' + this.escapeAttr(this.getWhatsappUrl()) + '" target="_blank" rel="noopener noreferrer">' + this.escape(t.btn_request) + "</a>" +
        "</div>";
      return;
    }

    var back =
      this.state.step > 1
        ? '<button type="button" class="ceq-btn ceq-btn-ghost" data-action="back">' + this.escape(t.btn_back) + "</button>"
        : '<span class="ceq-footer-spacer"></span>';

    var nextLabel = this.state.step === 3 ? t.btn_finish : t.btn_next;
    var disabled = this.canContinue() ? "" : " disabled";

    footer.innerHTML =
      '<div class="ceq-footer-inner">' +
      back +
      '<button type="button" class="ceq-btn ceq-btn-primary" data-action="next"' + disabled + ">" + this.escape(nextLabel) + "</button>" +
      "</div>";
  };

  CotizadorUI.prototype.renderStepOne = function () {
    var whatsappCard =
      '<a class="ceq-whatsapp-cta ceq-anim-in" href="' + this.escapeAttr(this.getWhatsappUrl()) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="ceq-whatsapp-icon">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12h10M7 8h10M7 16h6"></path><rect x="3" y="4" width="18" height="16" rx="4"></rect></svg>' +
      "</span>" +
      '<span class="ceq-whatsapp-text">' +
      '<span class="ceq-whatsapp-title">' + this.escape(this.config.texts.whatsapp_label) + "</span>" +
      '<span class="ceq-whatsapp-desc">' + this.escape(this.config.texts.whatsapp_desc) + "</span>" +
      "</span>" +
      '<span class="ceq-whatsapp-arrow">→</span>' +
      "</a>";

    return whatsappCard + this.renderOptionsList(this.config.processors, "select-processor", this.state.processorId, "processor") + this.renderQuickAccess();
  };

  CotizadorUI.prototype.renderOptionsList = function (items, actionName, selectedId, iconType) {
    var html = '<div class="ceq-options">';
    var self = this;

    items.forEach(function (item, index) {
      var selectedClass = item.id === selectedId ? " is-selected" : "";
      var icon = self.getIcon(iconType, index);

      html +=
        '<button type="button" class="ceq-option ceq-anim-in' + selectedClass + '" data-action="' + actionName + '" data-value="' + self.escapeAttr(item.id) + '" style="--ce-delay:' + index * 55 + 'ms;">' +
        '<span class="ceq-option-icon">' + icon + "</span>" +
        '<span class="ceq-option-main">' +
        '<span class="ceq-option-title">' + self.escape(item.front_label || item.label) + "</span>" +
        '<span class="ceq-option-description">' + self.escape(item.description || "") + "</span>" +
        "</span>" +
        '<span class="ceq-option-dot"></span>' +
        "</button>";
    });

    html += "</div>";
    return html;
  };

  CotizadorUI.prototype.renderPeriodConfigurator = function () {
    var matched = this.getMatchedPeriod();
    var units = this.getUnits();
    var price = this.getCurrentBasePrice();
    var total = price * this.state.quantity;
    var textNoMatch = "No existe una regla de precio para ese rango.";

    var unitsHtml = '<div class="ceq-unit-switch">';
    units.forEach(
      function (unit, index) {
        var active = unit === this.state.timeUnit ? " is-active" : "";
        unitsHtml +=
          '<button type="button" class="ceq-unit-btn ceq-anim-in' + active + '" data-action="set-unit" data-value="' + this.escapeAttr(unit) + '" style="--ce-delay:' + index * 45 + 'ms;">' +
          this.escape(this.unitLabel(unit)) +
          "</button>";
      }.bind(this)
    );
    unitsHtml += "</div>";

    var matchedHtml = matched
      ? '<div class="ceq-matched ceq-anim-in">' +
        '<p class="ceq-matched-title">' + this.escape(matched.front_label || matched.label) + "</p>" +
        '<p class="ceq-matched-desc">' + this.escape(matched.description || this.getPeriodRuleText(matched)) + "</p>" +
        '<p class="ceq-matched-rule">' + this.escape(this.getPeriodRuleText(matched)) + "</p>" +
        "</div>"
      : '<div class="ceq-unmatched ceq-anim-in">' + this.escape(textNoMatch) + "</div>";

    return (
      '<div class="ceq-grid">' +
      '<div class="ceq-panel ceq-anim-in">' +
      "<h3>" + this.escape(this.config.texts.period_label) + "</h3>" +
      unitsHtml +
      '<div class="ceq-counter-row">' +
      '<button type="button" class="ceq-counter-btn" data-action="time-minus">−</button>' +
      '<input type="number" min="1" max="999" data-field="time-value" class="ceq-counter-input" value="' + this.escapeAttr(this.state.timeValue) + '">' +
      '<button type="button" class="ceq-counter-btn" data-action="time-plus">+</button>' +
      "</div>" +
      '<p class="ceq-counter-help">' + this.escape(this.unitLabel(this.state.timeUnit)) + "</p>" +
      matchedHtml +
      '<div class="ceq-qty-wrap">' +
      "<h3>" + this.escape(this.config.texts.quantity_label) + "</h3>" +
      '<div class="ceq-counter-row">' +
      '<button type="button" class="ceq-counter-btn" data-action="qty-minus">−</button>' +
      '<input type="number" min="1" max="999" data-field="quantity-value" class="ceq-counter-input" value="' + this.escapeAttr(this.state.quantity) + '">' +
      '<button type="button" class="ceq-counter-btn" data-action="qty-plus">+</button>' +
      "</div>" +
      "</div>" +
      "</div>" +
      '<aside class="ceq-price-card ceq-anim-in">' +
      '<p class="ceq-price-label">' + this.escape(this.config.texts.price_label) + "</p>" +
      '<p class="ceq-price-value">' + this.escape(this.formatMoney(price)) + "</p>" +
      '<p class="ceq-price-note">' + this.escape(matched ? "Rango aplicado: " + (matched.front_label || matched.label) : "Sin rango de precio") + "</p>" +
      '<div class="ceq-price-total">Total: ' + this.escape(this.formatMoney(total)) + "</div>" +
      "</aside>" +
      "</div>"
    );
  };

  CotizadorUI.prototype.renderSummary = function () {
    var processor = this.findById(this.config.processors, this.state.processorId);
    var gama = this.findById(this.config.gamas, this.state.gamaId);
    var period = this.getMatchedPeriod();
    var unitPrice = this.getCurrentBasePrice();
    var total = unitPrice * this.state.quantity;

    return (
      '<div class="ceq-summary">' +
      '<div class="ceq-summary-card ceq-anim-in">' +
      '<p class="ceq-price-label">' + this.escape(this.config.texts.price_label) + "</p>" +
      '<p class="ceq-price-value">' + this.escape(this.formatMoney(unitPrice)) + "</p>" +
      '<p class="ceq-price-note">por laptop</p>' +
      '<dl class="ceq-specs">' +
      "<div><dt>Procesador</dt><dd>" + this.escape(processor ? processor.front_label || processor.label : "-") + "</dd></div>" +
      "<div><dt>Gama</dt><dd>" + this.escape(gama ? gama.front_label || gama.label : "-") + "</dd></div>" +
      "<div><dt>Tiempo elegido</dt><dd>" + this.escape(this.state.timeValue + " " + this.unitLabel(this.state.timeUnit)) + "</dd></div>" +
      "<div><dt>Rango aplicado</dt><dd>" + this.escape(period ? period.front_label || period.label : "Sin regla") + "</dd></div>" +
      "<div><dt>Unidades</dt><dd>" + this.escape(this.state.quantity) + "</dd></div>" +
      '<div><dt>Total mensual</dt><dd class="ceq-total">' + this.escape(this.formatMoney(total)) + "</dd></div>" +
      "</dl>" +
      "</div>" +
      '<div class="ceq-summary-side ceq-anim-in">' +
      '<div class="ceq-badge">Configuración lista</div>' +
      '<p>Si necesitas ajustes especiales, puedes continuar con asesoría por WhatsApp.</p>' +
      '<a class="ceq-inline-link" href="' + this.escapeAttr(this.getWhatsappUrl()) + '" target="_blank" rel="noopener noreferrer">' + this.escape(this.config.texts.whatsapp_label) + " →</a>" +
      "</div>" +
      "</div>"
    );
  };

  CotizadorUI.prototype.renderQuickAccess = function () {
    var isOpen = this.state.showQuick;
    var periodsUnits = this.getUnits();
    var processorOptions = this.renderSelectOptions(this.config.processors, this.state.processorId);
    var gamaOptions = this.renderSelectOptions(this.config.gamas, this.state.gamaId);
    var unitOptions = periodsUnits
      .map(
        function (unit) {
          var selected = unit === this.state.timeUnit ? ' selected="selected"' : "";
          return '<option value="' + this.escapeAttr(unit) + '"' + selected + ">" + this.escape(this.unitLabel(unit)) + "</option>";
        }.bind(this)
      )
      .join("");

    return (
      '<div class="ceq-quick-wrap ceq-anim-in">' +
      '<button type="button" class="ceq-manual-link" data-action="toggle-quick">' + this.escape(this.config.texts.manual_link) + "</button>" +
      '<div class="ceq-quick-panel' + (isOpen ? " is-open" : "") + '">' +
      '<h4>' + this.escape(this.config.texts.manual_title) + "</h4>" +
      '<div class="ceq-quick-grid">' +
      '<label><span>Procesador</span><select data-quick-field="processor">' + processorOptions + "</select></label>" +
      '<label><span>Gama</span><select data-quick-field="gama">' + gamaOptions + "</select></label>" +
      '<label><span>Unidad</span><select data-quick-field="unit">' + unitOptions + "</select></label>" +
      '<label><span>Tiempo</span><input type="number" min="1" max="999" data-quick-field="time" value="' + this.escapeAttr(this.state.timeValue) + '"></label>' +
      '<label><span>Laptops</span><input type="number" min="1" max="999" data-quick-field="quantity" value="' + this.escapeAttr(this.state.quantity) + '"></label>' +
      "</div>" +
      '<button type="button" class="ceq-btn ceq-btn-primary ceq-btn-small" data-action="quick-apply">' + this.escape(this.config.texts.manual_apply) + "</button>" +
      "</div>" +
      "</div>"
    );
  };

  CotizadorUI.prototype.renderSelectOptions = function (items, selectedId) {
    var html = '<option value="">Selecciona</option>';
    items.forEach(
      function (item) {
        var selected = item.id === selectedId ? ' selected="selected"' : "";
        html += '<option value="' + this.escapeAttr(item.id) + '"' + selected + ">" + this.escape(item.front_label || item.label) + "</option>";
      }.bind(this)
    );
    return html;
  };

  CotizadorUI.prototype.canContinue = function () {
    if (this.state.step === 1) {
      return Boolean(this.state.processorId);
    }
    if (this.state.step === 2) {
      return Boolean(this.state.gamaId);
    }
    if (this.state.step === 3) {
      return Boolean(this.state.processorId && this.state.gamaId && this.state.periodId);
    }
    return true;
  };

  CotizadorUI.prototype.updateMatchedPeriod = function () {
    var period = this.findPeriodFor(this.state.timeUnit, this.state.timeValue);
    this.state.periodId = period ? period.id : null;
  };

  CotizadorUI.prototype.getMatchedPeriod = function () {
    if (!this.state.periodId) {
      return null;
    }
    return this.findById(this.config.periods, this.state.periodId);
  };

  CotizadorUI.prototype.findPeriodFor = function (unit, value) {
    var time = this.clampInt(value, 1, 999, 1);
    var candidate = null;
    this.config.periods.forEach(function (period) {
      if (period.unit !== unit) {
        return;
      }
      var min = parseInt(period.min_value, 10) || 1;
      var max = period.max_value === "" ? Number.POSITIVE_INFINITY : parseInt(period.max_value, 10) || min;
      if (time >= min && time <= max && !candidate) {
        candidate = period;
      }
    });
    return candidate;
  };

  CotizadorUI.prototype.getCurrentBasePrice = function () {
    if (!this.state.processorId || !this.state.gamaId || !this.state.periodId) {
      return 0;
    }

    var entry = this.config.prices[this.state.processorId];
    if (!entry || !entry[this.state.gamaId]) {
      return 0;
    }

    var raw = entry[this.state.gamaId][this.state.periodId];
    if (typeof raw === "undefined" || raw === "") {
      return 0;
    }

    var numeric = parseFloat(raw);
    return isNaN(numeric) ? 0 : numeric;
  };

  CotizadorUI.prototype.getUnits = function () {
    var units = [];
    this.config.periods.forEach(function (period) {
      if (!units.includes(period.unit)) {
        units.push(period.unit);
      }
    });
    return units;
  };

  CotizadorUI.prototype.unitLabel = function (unit) {
    if (unit === "dias") return "Días";
    if (unit === "semanas") return "Semanas";
    return "Meses";
  };

  CotizadorUI.prototype.getPeriodRuleText = function (period) {
    var min = parseInt(period.min_value, 10) || 1;
    var max = period.max_value === "" ? "sin límite" : period.max_value;
    return this.unitLabel(period.unit) + ": " + min + " a " + max;
  };

  CotizadorUI.prototype.getWhatsappUrl = function () {
    var url = this.config.texts.whatsapp_url || "https://wa.me/";
    return url;
  };

  CotizadorUI.prototype.formatMoney = function (amount) {
    var formatted = Number(amount).toLocaleString("es-PE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return (this.config.currency_symbol || "S/.") + formatted;
  };

  CotizadorUI.prototype.findById = function (items, id) {
    if (!id) return null;
    return items.find(this.byId(id)) || null;
  };

  CotizadorUI.prototype.byId = function (id) {
    return function (item) {
      return item.id === id;
    };
  };

  CotizadorUI.prototype.clampInt = function (value, min, max, fallback) {
    var numeric = parseInt(value, 10);
    if (isNaN(numeric)) {
      return fallback;
    }
    if (numeric < min) return min;
    if (numeric > max) return max;
    return numeric;
  };

  CotizadorUI.prototype.normalizeConfig = function (config) {
    var defaults = this.getDefaultConfig();
    var raw = config || {};

    var processors = this.normalizeCatalog(raw.processors, defaults.processors);
    var gamas = this.normalizeCatalog(raw.gamas, defaults.gamas);
    var periods = this.normalizePeriods(raw.periods, defaults.periods);

    return {
      currency_symbol: raw.currency_symbol || defaults.currency_symbol,
      texts: Object.assign({}, defaults.texts, raw.texts || {}),
      processors: processors,
      gamas: gamas,
      periods: periods,
      prices: raw.prices && typeof raw.prices === "object" ? raw.prices : {},
    };
  };

  CotizadorUI.prototype.normalizeCatalog = function (rawItems, fallback) {
    var source = Array.isArray(rawItems) && rawItems.length ? rawItems : fallback;
    return source
      .map(function (item) {
        if (!item || !item.id || !item.label) {
          return null;
        }
        return {
          id: String(item.id),
          label: String(item.label),
          front_label: String(item.front_label || item.label),
          description: String(item.description || ""),
        };
      })
      .filter(Boolean);
  };

  CotizadorUI.prototype.normalizePeriods = function (rawItems, fallback) {
    var source = Array.isArray(rawItems) && rawItems.length ? rawItems : fallback;
    var allowedUnits = ["dias", "semanas", "meses"];

    return source
      .map(function (item) {
        if (!item || !item.id || !item.label) {
          return null;
        }

        var unit = allowedUnits.includes(item.unit) ? item.unit : "meses";
        var min = parseInt(item.min_value, 10);
        if (isNaN(min) || min < 1) min = 1;

        var max = "";
        if (item.max_value !== "" && item.max_value !== null && typeof item.max_value !== "undefined") {
          max = parseInt(item.max_value, 10);
          if (isNaN(max) || max < min) {
            max = min;
          }
        }

        return {
          id: String(item.id),
          label: String(item.label),
          front_label: String(item.front_label || item.label),
          description: String(item.description || ""),
          unit: unit,
          min_value: min,
          max_value: max === "" ? "" : max,
        };
      })
      .filter(Boolean);
  };

  CotizadorUI.prototype.getDefaultConfig = function () {
    return {
      currency_symbol: "S/.",
      texts: {
        step1_eyebrow: "PASO 1 DE 4",
        step1_title: "¿Qué aplicaciones vas a utilizar?",
        step1_subtitle: "Elige la potencia que mejor se adapta a tus tareas habituales.",
        step2_eyebrow: "PASO 2 DE 4",
        step2_title: "¿Qué tan pesada será la jornada para tu laptop?",
        step2_subtitle: "El chasis determina la durabilidad, ventilación y portabilidad del equipo.",
        step3_eyebrow: "PASO 3 DE 4",
        step3_title: "Elige el tiempo de alquiler",
        step3_subtitle: "Selecciona unidad y cantidad; calculamos el periodo exacto automáticamente.",
        step4_eyebrow: "PASO 4 DE 4",
        step4_title: "Tu cotización está lista",
        step4_subtitle: "Revisa el resumen antes de solicitar contacto.",
        btn_next: "Continuar →",
        btn_back: "← Volver",
        btn_finish: "Ver mi solución",
        btn_restart: "Cambiar selección",
        btn_request: "Quiero hablar con un especialista ahora →",
        price_label: "CUOTA MENSUAL / LAPTOP",
        quantity_label: "Cantidad de laptops",
        period_label: "Duración del alquiler",
        whatsapp_label: "Quiero hablar con un especialista ahora",
        whatsapp_desc: "Si prefieres, te atendemos por WhatsApp y armamos la cotización contigo.",
        whatsapp_url: "https://wa.me/",
        manual_link: "¿Ya conoces lo que quieres? Configúralo manualmente",
        manual_title: "Configuración rápida",
        manual_apply: "Aplicar e ir al resumen",
      },
      processors: [],
      gamas: [],
      periods: [],
    };
  };

  CotizadorUI.prototype.getIcon = function (kind, index) {
    var icons = {
      processor: [
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="3"></rect><path d="M9 9h6v6H9z"></path></svg>',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 8h8v8H8z"></path><path d="M3 12h5m8 0h5M12 3v5m0 8v5"></path></svg>',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16v12H4z"></path><path d="M9 18v2m6-2v2"></path></svg>',
      ],
      gama: [
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 18h16"></path><path d="M7 18V8h10v10"></path></svg>',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 14h16"></path><path d="M6 14V6h12v8"></path><path d="M8 18h8"></path></svg>',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l8 5v8l-8 5-8-5V8l8-5z"></path><path d="M9 12l2 2 4-4"></path></svg>',
      ],
    };

    var list = icons[kind] || icons.processor;
    return list[index % list.length];
  };

  CotizadorUI.prototype.escape = function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  CotizadorUI.prototype.escapeAttr = function (value) {
    return this.escape(value);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCotizadores);
  } else {
    initCotizadores();
  }
})();
