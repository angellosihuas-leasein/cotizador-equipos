(function () {
  "use strict";

  var form = document.getElementById("ce-settings-form");
  if (!form) {
    return;
  }

  var rawSettings = window.ceAdminData && window.ceAdminData.settings ? window.ceAdminData.settings : {};
  var state = normalizeState(rawSettings);

  var lists = {
    processors: document.getElementById("ce-processors-list"),
    gamas: document.getElementById("ce-gamas-list"),
    periods: document.getElementById("ce-periods-list"),
  };

  var matrixContainer = document.getElementById("ce-price-matrix");
  var jsonField = document.getElementById("ce-settings-json");
  var currencyInput = document.getElementById("ce-currency-symbol");
  var textInputs = form.querySelectorAll("[data-text-key]");

  initFields();
  renderAll();
  attachEvents();

  function initFields() {
    currencyInput.value = state.currency_symbol || "S/";
    textInputs.forEach(function (input) {
      var key = input.getAttribute("data-text-key");
      input.value = state.texts[key] || "";
    });
  }

  function attachEvents() {
    form.addEventListener("input", function (event) {
      var target = event.target;

      if (target.id === "ce-currency-symbol") {
        state.currency_symbol = target.value.trim() || "S/";
        return;
      }

      var textKey = target.getAttribute("data-text-key");
      if (textKey) {
        state.texts[textKey] = target.value;
        return;
      }

      var listName = target.getAttribute("data-list");
      if (listName) {
        var index = parseInt(target.getAttribute("data-index"), 10);
        var field = target.getAttribute("data-field");

        if (!state[listName] || isNaN(index) || !state[listName][index]) {
          return;
        }

        state[listName][index][field] = target.value;
        if (field === "label") {
          renderMatrix();
        }
        return;
      }

      if (target.classList.contains("ce-price-input")) {
        var processorId = target.getAttribute("data-processor-id");
        var gamaId = target.getAttribute("data-gama-id");
        var periodId = target.getAttribute("data-period-id");
        setPrice(processorId, gamaId, periodId, target.value);
      }
    });

    form.addEventListener("click", function (event) {
      var addButton = event.target.closest(".ce-add-item");
      if (addButton) {
        var list = addButton.getAttribute("data-list");
        addListItem(list);
        return;
      }

      var removeButton = event.target.closest("[data-action='remove-item']");
      if (removeButton) {
        var listName = removeButton.getAttribute("data-list");
        var index = parseInt(removeButton.getAttribute("data-index"), 10);

        if (!state[listName] || state[listName].length <= 1) {
          return;
        }

        state[listName].splice(index, 1);
        normalizePrices();
        renderAll();
      }
    });

    form.addEventListener("submit", function () {
      normalizePrices();
      jsonField.value = JSON.stringify(state);
    });
  }

  function addListItem(listName) {
    if (!state[listName]) {
      return;
    }

    var id = buildUniqueId(listName);
    state[listName].push({
      id: id,
      label: "",
      description: "",
    });

    normalizePrices();
    renderAll();
  }

  function buildUniqueId(listName) {
    var prefixes = {
      processors: "proc",
      gamas: "gama",
      periods: "periodo",
    };
    var prefix = prefixes[listName] || "item";
    var i = 1;
    var candidate = prefix + "_" + i;

    while (
      state[listName].some(function (item) {
        return item.id === candidate;
      })
    ) {
      i += 1;
      candidate = prefix + "_" + i;
    }

    return candidate;
  }

  function renderAll() {
    renderList("processors", "Procesador");
    renderList("gamas", "Gama");
    renderList("periods", "Periodo");
    renderMatrix();
  }

  function renderList(listName, labelTitle) {
    var container = lists[listName];
    if (!container) {
      return;
    }

    var items = state[listName] || [];
    var html = "";

    items.forEach(function (item, index) {
      html +=
        '<div class="ce-list-item">' +
        '<div class="ce-list-row">' +
        "<label>" +
        "<span>" +
        labelTitle +
        "</span>" +
        '<input type="text" data-list="' +
        listName +
        '" data-index="' +
        index +
        '" data-field="label" value="' +
        escapeHtml(item.label || "") +
        '">' +
        "</label>" +
        '<button type="button" class="button ce-btn-link" data-action="remove-item" data-list="' +
        listName +
        '" data-index="' +
        index +
        '">Eliminar</button>' +
        "</div>" +
        "<label>" +
        "<span>Descripcion</span>" +
        '<textarea rows="2" data-list="' +
        listName +
        '" data-index="' +
        index +
        '" data-field="description">' +
        escapeHtml(item.description || "") +
        "</textarea>" +
        "</label>" +
        '<p class="ce-id">ID interno: <code>' +
        escapeHtml(item.id || "") +
        "</code></p>" +
        "</div>";
    });

    container.innerHTML = html;
  }

  function renderMatrix() {
    var processors = state.processors || [];
    var gamas = state.gamas || [];
    var periods = state.periods || [];

    if (!processors.length || !gamas.length || !periods.length) {
      matrixContainer.innerHTML = '<p class="ce-empty">Debes tener al menos 1 procesador, 1 gama y 1 periodo.</p>';
      return;
    }

    normalizePrices();

    var html = '<table class="ce-table"><thead><tr><th>Procesador</th><th>Gama</th>';
    periods.forEach(function (period) {
      html += "<th>" + escapeHtml(period.label || period.id) + "</th>";
    });
    html += "</tr></thead><tbody>";

    processors.forEach(function (processor) {
      gamas.forEach(function (gama) {
        html += "<tr>";
        html += "<td>" + escapeHtml(processor.label || processor.id) + "</td>";
        html += "<td>" + escapeHtml(gama.label || gama.id) + "</td>";

        periods.forEach(function (period) {
          var value = getPrice(processor.id, gama.id, period.id);
          html +=
            '<td><div class="ce-price-field"><span>' +
            escapeHtml(state.currency_symbol || "S/") +
            '</span><input type="number" min="0" step="0.01" class="ce-price-input" data-processor-id="' +
            escapeHtml(processor.id) +
            '" data-gama-id="' +
            escapeHtml(gama.id) +
            '" data-period-id="' +
            escapeHtml(period.id) +
            '" value="' +
            escapeHtml(value) +
            '"></div></td>';
        });

        html += "</tr>";
      });
    });

    html += "</tbody></table>";
    matrixContainer.innerHTML = html;
  }

  function normalizePrices() {
    var normalized = {};

    state.processors.forEach(function (processor) {
      normalized[processor.id] = {};

      state.gamas.forEach(function (gama) {
        normalized[processor.id][gama.id] = {};

        state.periods.forEach(function (period) {
          normalized[processor.id][gama.id][period.id] = getPrice(processor.id, gama.id, period.id);
        });
      });
    });

    state.prices = normalized;
  }

  function getPrice(processorId, gamaId, periodId) {
    if (
      !state.prices ||
      !state.prices[processorId] ||
      !state.prices[processorId][gamaId] ||
      typeof state.prices[processorId][gamaId][periodId] === "undefined"
    ) {
      return "";
    }

    return String(state.prices[processorId][gamaId][periodId] || "");
  }

  function setPrice(processorId, gamaId, periodId, value) {
    if (!state.prices[processorId]) {
      state.prices[processorId] = {};
    }

    if (!state.prices[processorId][gamaId]) {
      state.prices[processorId][gamaId] = {};
    }

    state.prices[processorId][gamaId][periodId] = value;
  }

  function normalizeState(raw) {
    var settings = deepClone(raw || {});
    var defaults = {
      currency_symbol: "S/",
      texts: {},
      processors: [],
      gamas: [],
      periods: [],
      prices: {},
    };

    settings.currency_symbol = settings.currency_symbol || defaults.currency_symbol;
    settings.texts = settings.texts || defaults.texts;
    settings.processors = sanitizeList(settings.processors, "proc", "Core i5");
    settings.gamas = sanitizeList(settings.gamas, "gama", "Gama base");
    settings.periods = sanitizeList(settings.periods, "periodo", "1 mes");
    settings.prices = settings.prices || defaults.prices;

    return settings;
  }

  function sanitizeList(list, prefix, fallbackLabel) {
    var cleaned = [];
    var used = {};

    if (!Array.isArray(list)) {
      list = [];
    }

    list.forEach(function (item, index) {
      if (!item || typeof item !== "object") {
        return;
      }

      var id = String(item.id || "").trim();
      if (!id) {
        id = prefix + "_" + (index + 1);
      }

      while (used[id]) {
        id += "_2";
      }
      used[id] = true;

      cleaned.push({
        id: id,
        label: String(item.label || "").trim(),
        description: String(item.description || "").trim(),
      });
    });

    if (!cleaned.length) {
      cleaned.push({
        id: prefix + "_1",
        label: fallbackLabel,
        description: "",
      });
    }

    return cleaned;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
