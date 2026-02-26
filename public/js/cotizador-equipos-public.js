(function () {
  "use strict";

  function loadLottieScript() {
    var lottieUrl =
      "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
    // Verificamos que no se haya cargado antes para evitar duplicados
    if (!document.querySelector('script[src="' + lottieUrl + '"]')) {
      var script = document.createElement("script");
      script.src = lottieUrl;
      script.async = true;
      document.head.appendChild(script);
    }
  }

  function initCotizadores() {
    loadLottieScript();

    var containers = document.querySelectorAll(".ce-cotizador[data-ce-config]");
    containers.forEach(function (container) {
      if (!container.getAttribute("data-ce-config")) return;
      try {
        new CotizadorUI(
          container,
          JSON.parse(container.getAttribute("data-ce-config")),
        ).mount();
      } catch (e) {
        console.error("Error cargando cotizador:", e);
      }
    });
  }

  function CotizadorUI(root, config) {
    this.root = root;
    this.config = this.normalizeConfig(config);
    this.state = {
      step: 0,
      processorId: null,
      gamaId: null,
      timeUnit: "meses",
      timeValue: 1,
      quantity: 1,
      selectedExtras: { ram: "", almacenamiento: "" },
      isModalOpen: false,
    };
  }

  CotizadorUI.prototype.mount = function () {
    // 1. Creamos el HTML base.
    // Fíjate que cerramos el </div> de .ceq-stage ANTES de abrir .ceq-footer
    this.root.innerHTML =
      '<div class="ce-cotizador-wrapper">' +
      '<div class="ceq-stage">' +
      '<div class="ceq-header"></div>' +
      '<div class="ceq-body"></div>' +
      "</div>" + // Aquí cerramos el contenedor que recibe el fade
      '<div class="ceq-footer"></div>' + // El footer queda estático
      '<div class="ceq-modal-root"></div>' +
      "</div>";

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
        if (!self.state.processorId && self.config.processors.length)
          self.state.processorId = self.config.processors[0].id;
        if (!self.state.gamaId && self.config.gamas.length)
          self.state.gamaId = self.config.gamas[0].id;
        self.goToStep(5);
      }

      if (action === "next" && self.canContinue())
        self.goToStep(self.state.step + 1);
      if (action === "back")
        self.goToStep(self.state.step === 5 ? 0 : self.state.step - 1);
      if (action === "restart") {
        self.state.step = 0;
        self.state.quantity = 1;
        self.state.timeValue = 1;
        self.state.selectedExtras = { ram: "", almacenamiento: "" };
        self.goToStep(0);
      }

      if (action === "select-processor") {
        self.state.processorId = btn.getAttribute("data-value");
        self.renderBody();
        self.renderFooter();
      }
      if (action === "select-gama") {
        self.state.gamaId = btn.getAttribute("data-value");
        self.renderBody();
        self.renderFooter();
      }
      if (action === "set-unit") {
        self.state.timeUnit = btn.getAttribute("data-value");
        self.state.timeValue = 1;
        self.renderBody();
        self.renderFooter();
      }
      if (action === "time-minus") {
        self.state.timeValue = Math.max(
          1,
          self.state.timeValue - parseInt(btn.getAttribute("data-amount")),
        );
        self.renderBody();
        self.renderFooter();
      }
      if (action === "time-plus") {
        self.state.timeValue = Math.min(
          999,
          self.state.timeValue + parseInt(btn.getAttribute("data-amount")),
        );
        self.renderBody();
        self.renderFooter();
      }
      if (action === "qty-minus") {
        self.state.quantity = Math.max(
          1,
          self.state.quantity - parseInt(btn.getAttribute("data-amount")),
        );
        self.renderBody();
        self.renderFooter();
      }
      if (action === "qty-plus") {
        self.state.quantity = Math.min(
          999,
          self.state.quantity + parseInt(btn.getAttribute("data-amount")),
        );
        self.renderBody();
        self.renderFooter();
      }

      if (action === "open-modal") {
        self.state.isModalOpen = true;
        self.renderModal();
      }
      if (action === "close-modal") {
        self.closeModal();
      }
    });

    this.root.addEventListener("change", function (e) {
      var action = e.target.getAttribute("data-action");
      if (action === "change-proc") {
        self.state.processorId = e.target.value;
        self.renderBody();
        self.renderFooter();
      }
      if (action === "change-gama") {
        self.state.gamaId = e.target.value;
        self.renderBody();
        self.renderFooter();
      }
      if (action === "change-extra") {
        var type = e.target.getAttribute("data-type");
        self.state.selectedExtras[type] = e.target.value;
        self.renderBody();
        self.renderFooter();
      }
    });

    this.root.addEventListener("submit", function (e) {
      if (e.target.id === "ceq-quote-form") {
        e.preventDefault();
        var formEl = e.target;
        var btn = formEl.querySelector('button[type="submit"]');
        var successEl = self.root.querySelector("#successView");

        btn.classList.add("loading-btn");

        setTimeout(function () {
          formEl.classList.add("form-animate-out");
          successEl.classList.add("success-animate-in"); // Ya no usamos 'draw-svg'

          // Reproducimos la animación Lottie
          var lottiePlayer = successEl.querySelector("lottie-player");
          if (lottiePlayer) {
            lottiePlayer.seek(0); // Reinicia la animación por si se abre de nuevo
            lottiePlayer.play();
          }
        }, 1000);
      }
    });
  };

  CotizadorUI.prototype.closeModal = function () {
    var self = this;
    var overlay = this.root.querySelector(".ceq-modal-overlay");
    var successView = this.root.querySelector("#successView");
    
    // Verificamos si el mensaje de éxito es visible
    var isSuccessActive = successView && successView.classList.contains("success-animate-in");

    if (overlay) overlay.classList.add("is-closing");

    setTimeout(function () {
      self.state.isModalOpen = false;
      
      // Si el usuario cerró el modal después de enviar el formulario:
      if (isSuccessActive) {
        // Reiniciamos el estado completo
        self.state.step = 0;
        self.state.quantity = 1;
        self.state.timeValue = 1;
        self.state.selectedExtras = { ram: "", almacenamiento: "" };
        self.state.processorId = null;
        self.state.gamaId = null;
        
        // Renderizamos todo desde el inicio (Paso 0)
        self.render();
      } else {
        // Si solo cerró el modal sin enviar, solo refrescamos el modal
        self.renderModal();
      }
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
    var currentWrapper = this.root.querySelector(".ce-cotizador-wrapper");
    if (currentWrapper) {
      // Mantiene la clase base + agrega step-N
      currentWrapper.className = "ce-cotizador-wrapper step-" + this.state.step;
    }

    this.renderHeader();
    this.renderBody();
    this.renderFooter();
    this.renderModal();
  };

  CotizadorUI.prototype.renderHeader = function () {
    if (this.state.step === 0 || this.state.step === 4) {
      this.root.querySelector(".ceq-header").innerHTML = "";
      return;
    }
    var t = this.config.texts || {};
    var st = {
      1: {
        eye: "PASO 1 DE 4",
        title: "¿Qué aplicaciones vas a utilizar?",
        sub: "Elige la potencia que mejor se adapta a tus tareas habituales.",
      },
      2: {
        eye: "PASO 2 DE 4",
        title: "¿Qué tan pesada será la jornada para tu laptop?",
        sub: "El chasis determina la durabilidad, ventilación y portabilidad del equipo.",
      },
      3: { eye: "PASO 3 DE 4", title: "Configura tu plan de alquiler" },
      5: {
        eye: "MODO MANUAL",
        title: t.manual_title || "Configuración Rápida",
        sub: "Personaliza tu equipo, extras y tiempo al instante.",
      },
    }[this.state.step];

    this.root.querySelector(".ceq-header").innerHTML =
      '<span class="ceq-eyebrow">' +
      (st.eye || "") +
      '</span><h2 class="ceq-title">' +
      (st.title || "") +
      '</h2><p class="ceq-subtitle">' +
      (st.sub || "") +
      "</p>";
  };

  CotizadorUI.prototype.getIcon = function (step, i) {
    // SVGs por paso e índice (i)
    var icons = {
      1: [
        // Step 1 (processors)
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.6667 2.5H3.33341C2.41294 2.5 1.66675 3.24619 1.66675 4.16667V12.5C1.66675 13.4205 2.41294 14.1667 3.33341 14.1667H16.6667C17.5872 14.1667 18.3334 13.4205 18.3334 12.5V4.16667C18.3334 3.24619 17.5872 2.5 16.6667 2.5Z" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.66675 17.5H13.3334" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 14.1666V17.5" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15 13.3333L18.3333 9.99996L15 6.66663" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.00008 6.66663L1.66675 9.99996L5.00008 13.3333" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.0834 3.33337L7.91675 16.6667" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      ],
      2: [
        // Step 2 (gamas)
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16.6667 2.5H3.33341C2.41294 2.5 1.66675 3.24619 1.66675 4.16667V12.5C1.66675 13.4205 2.41294 14.1667 3.33341 14.1667H16.6667C17.5872 14.1667 18.3334 13.4205 18.3334 12.5V4.16667C18.3334 3.24619 17.5872 2.5 16.6667 2.5Z" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M6.66675 17.5H13.3334" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M10 14.1666V17.5" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.3334 5.83337H3.33341C2.41294 5.83337 1.66675 6.57957 1.66675 7.50004V12.5C1.66675 13.4205 2.41294 14.1667 3.33341 14.1667H13.3334C14.2539 14.1667 15.0001 13.4205 15.0001 12.5V7.50004C15.0001 6.57957 14.2539 5.83337 13.3334 5.83337Z" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.3333 9.16663V10.8333" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
        `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8.33325 8.33337V4.16671C8.33325 3.94569 8.42105 3.73373 8.57733 3.57745C8.73361 3.42117 8.94557 3.33337 9.16659 3.33337H10.8333C11.0543 3.33337 11.2662 3.42117 11.4225 3.57745C11.5788 3.73373 11.6666 3.94569 11.6666 4.16671V8.33337" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.6667 5C12.9928 5 14.2646 5.52678 15.2023 6.46447C16.14 7.40215 16.6667 8.67392 16.6667 10V12.5" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.33325 12.5V10C3.33325 8.67392 3.86004 7.40215 4.79772 6.46447C5.7354 5.52678 7.00717 5 8.33325 5" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M17.5001 12.5H2.50008C2.03984 12.5 1.66675 12.8731 1.66675 13.3333V15C1.66675 15.4602 2.03984 15.8333 2.50008 15.8333H17.5001C17.9603 15.8333 18.3334 15.4602 18.3334 15V13.3333C18.3334 12.8731 17.9603 12.5 17.5001 12.5Z" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`,
      ],
    };

    // Devuelve SVG o vacío si no existe
    return icons[step] && icons[step][i] ? icons[step][i] : "";
  };

  CotizadorUI.prototype.getRadioSvg = function (isSelected) {
    if (isSelected)
      return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="path-1-inside-1_1072_532" fill="white"><path d="M0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10Z"/></mask><path d="M0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10Z" fill="#FE5000"/><path d="M0 10M20 10M20 10M0 10M10 0M20 10M10 20M0 10M10 20V18C5.58172 18 2 14.4183 2 10H0H-2C-2 16.6274 3.37258 22 10 22V20ZM20 10H18C18 14.4183 14.4183 18 10 18V20V22C16.6274 22 22 16.6274 22 10H20ZM10 0V2C14.4183 2 18 5.58172 18 10H20H22C22 3.37258 16.6274 -2 10 -2V0ZM10 0V-2C3.37258 -2 -2 3.37258 -2 10H0H2C2 5.58172 5.58172 2 10 2V0Z" fill="#FE5000" mask="url(#path-1-inside-1_1072_532)"/><path d="M6.5 10.5L8.5 12.5L13.5 7.5" stroke="white" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="path-1-inside-1_1165_292" fill="white"><path d="M0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10Z"/></mask><path d="M0 10M20 10M20 10M0 10M10 0M20 10M10 20M0 10M10 20V18C5.58172 18 2 14.4183 2 10H0H-2C-2 16.6274 3.37258 22 10 22V20ZM20 10H18C18 14.4183 14.4183 18 10 18V20V22C16.6274 22 22 16.6274 22 10H20ZM10 0V2C14.4183 2 18 5.58172 18 10H20H22C22 3.37258 16.6274 -2 10 -2V0ZM10 0V-2C3.37258 -2 -2 3.37258 -2 10H0H2C2 5.58172 5.58172 2 10 2V0Z" fill="#F6F7F9" mask="url(#path-1-inside-1_1165_292)"/></svg>';
  };

  CotizadorUI.prototype.renderBody = function () {
    var body = this.root.querySelector(".ceq-body");
    var self = this;
    var t = this.config.texts || {};

    if (this.state.step === 0) {
      body.innerHTML = `
            <div class="ceq-welcome-wrap">
                <div class="ceq-welcome-content">
                    <h1 class="ceq-title ceq-welcome-title">${t.welcome_title || "Cotiza el alquiler de laptops para tu empresa en segundos"}</h1>
                    <p class="ceq-subtitle ceq-welcome-subtitle">${t.welcome_subtitle || "Obtén precios al instante con nuestro cotizador digital o configura una propuesta técnica a medida."}</p>
                    <div class="ceq-welcome-actions">
                        <button class="ceq-btn-primary" data-action="start-smart">
                            ${t.btn_smart || "Iniciar cotización inteligente"}
                            <svg class="ceq-icon-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                        
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
                            ${t.btn_manual || "Configura aquí"}
                        </button>
                    </div>
                </div>
                <div class="ceq-welcome-visual">
                    <img src="${cotizadorData.pluginUrl}img/yosellin.png" alt="Especialista" class="ceq-welcome-img" />
                </div>
            </div>
        `;
      return;
    }

    if (this.state.step === 1 || this.state.step === 2) {
      var items =
        this.state.step === 1 ? this.config.processors : this.config.gamas;
      var selectedId =
        this.state.step === 1 ? this.state.processorId : this.state.gamaId;
      var action = this.state.step === 1 ? "select-processor" : "select-gama";

      var waBtn =
        this.state.step === 1
          ? '<a class="ceq-whatsapp-cta" href="' +
            (t.whatsapp_url || "https://wa.me/") +
            '" target="_blank"><div class="wsp-wrapper-text"><span class="ceq-opt-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1165_252)"><path d="M10.6916 1.81668C10.4744 1.71764 10.2385 1.66638 9.99989 1.66638C9.76123 1.66638 9.52536 1.71764 9.30822 1.81668L2.16656 5.06668C2.01868 5.13188 1.89295 5.23868 1.80469 5.37406C1.71643 5.50944 1.66943 5.66757 1.66943 5.82918C1.66943 5.99079 1.71643 6.14892 1.80469 6.2843C1.89295 6.41968 2.01868 6.52648 2.16656 6.59168L9.31656 9.85001C9.53369 9.94905 9.76956 10.0003 10.0082 10.0003C10.2469 10.0003 10.4828 9.94905 10.6999 9.85001L17.8499 6.60001C17.9978 6.53481 18.1235 6.42801 18.2118 6.29263C18.3 6.15725 18.347 5.99913 18.347 5.83751C18.347 5.6759 18.3 5.51777 18.2118 5.38239C18.1235 5.24701 17.9978 5.14022 17.8499 5.07501L10.6916 1.81668Z" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3334 14.7084L10.6917 18.175C10.4746 18.2741 10.2387 18.3253 10.0001 18.3253C9.76142 18.3253 9.52555 18.2741 9.30841 18.175L1.66675 14.7084" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3334 10.5416L10.6917 14.0083C10.4746 14.1073 10.2387 14.1586 10.0001 14.1586C9.76142 14.1586 9.52555 14.1073 9.30841 14.0083L1.66675 10.5416" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="clip0_1165_252"><rect width="20" height="20" fill="white"/></clipPath></defs></svg></span><span class="ceq-wa-text"><span class="ceq-wa-title">' +
            (t.whatsapp_label || "Quiero hablar con un especialista") +
            '</span><span class="ceq-wa-desc">' +
            (t.whatsapp_desc || "") +
            '</span></div></span><span style="color:#ea580c; font-size:24px; font-weight:300;">→</span></a>'
          : "";
      var manualLink =
        this.state.step === 1
          ? '<div style="text-align:center; margin-top:24px;"><button type="button" class="ceq-btn-ghost" style="color:#ea580c; font-size:15px; text-decoration:underline;" data-action="go-manual">' +
            (t.manual_link ||
              "¿Ya conoces lo que quieres? Configúralo manualmente") +
            "</button></div>"
          : "";

      var html = '<div class="ceq-options">';
      items.forEach(function (item, i) {
        var isSelected = item.id === selectedId;
        var displayTitle =
          item.front_label && item.front_label.trim() !== ""
            ? item.front_label
            : item.label;
        html +=
          '<button type="button" class="ceq-option ' +
          (isSelected ? "is-selected" : "") +
          '" data-action="' +
          action +
          '" data-value="' +
          item.id +
          '">' +
          '<div class="ceq-icon-wrapper"><span class="ceq-opt-icon">' +
          self.getIcon(self.state.step, i) +
          "</span>" +
          '<span class="ceq-opt-main"><span class="ceq-opt-title">' +
          displayTitle +
          '</span><span class="ceq-opt-desc">' +
          item.description +
          "</span></span></div>" +
          '<span class="ceq-opt-radio">' +
          self.getRadioSvg(isSelected) +
          "</span></button>";
      });
      body.innerHTML = html + "</div>" + waBtn;
      return;
    }

    var singleUnit = this.state.timeUnit === "meses" ? "mes" : "semana";
    var timeLabel = this.state.timeUnit === "meses" ? "POR MES" : "POR SEMANA";
    var qtyLabel = this.state.quantity > 1 ? "laptops" : "laptop";
    var pBase = this.getBasePrice();
    var tPricePerPeriod = pBase * this.state.quantity;
    var finalPriceAbsolute = tPricePerPeriod * this.state.timeValue;

    if (this.state.step === 5) {
      // (Se omite visualmente el código del paso 5 por espacio, mantenlo igual que en tu código original, solo cambian las variables matemáticas si las tocas).
      // Aquí asumo que usas tu mismo código para el paso 5.
      // ... (Usa tu código original del if step === 5)
    }

    if (this.state.step === 3) {
      var proc = this.config.processors.find(
        (p) => p.id === this.state.processorId,
      );
      body.innerHTML = `
        <div class="ceq-layout-split">
            <div class="ceq-layout-left">
                <div class="ceq-box ceq-box-base">
                    <div class="ceq-box-eyebrow">Tu equipo base incluye</div>
                    <div class="ceq-box-title">${proc ? proc.label : ""} + 16 GB RAM + 512 GB SSD</div>
                    <div class="ceq-box-desc">Puedes añadir extras más adelante si deseas.</div>
                </div>
                <div class="ceq-box ceq-box-row">
                    <div class="ceq-opt-icon" style="border-radius:8px;"><svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.2578 7.99996V1.99996C12.2578 1.64634 12.1174 1.3072 11.8673 1.05715C11.6173 0.807102 11.2781 0.666626 10.9245 0.666626H2.92449C2.57087 0.666626 2.23173 0.807102 1.98168 1.05715C1.73164 1.3072 1.59116 1.64634 1.59116 1.99996V7.99996M12.2578 7.99996H1.59116M12.2578 7.99996L13.1112 9.69996C13.1626 9.80195 13.1869 9.91544 13.1818 10.0295C13.1768 10.1436 13.1425 10.2545 13.0822 10.3516C13.022 10.4486 12.9379 10.5285 12.8379 10.5837C12.7379 10.6389 12.6254 10.6674 12.5112 10.6666H1.33783C1.22362 10.6674 1.11112 10.6389 1.01112 10.5837C0.911123 10.5285 0.826974 10.4486 0.766744 10.3516C0.706514 10.2545 0.672223 10.1436 0.66716 10.0295C0.662096 9.91544 0.686429 9.80195 0.737827 9.69996L1.59116 7.99996" stroke="#FE5000" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
                    <div class="ceq-opt-main"><div class="ceq-box-title">Cantidad de laptops</div><div class="ceq-box-desc">Unidades a contratar</div></div>
                    <div>
                        <div class="ceq-counter-wrap" style="margin:0;">
                            <button class="ceq-c-btn" style="width:40px;height:40px;font-size:20px;" data-action="qty-minus" data-amount="1">−</button>
                            <div class="ceq-c-val"><strong style="font-size:24px;margin:0 16px;">${this.state.quantity}</strong></div>
                            <button class="ceq-c-btn" style="width:40px;height:40px;font-size:20px;" data-action="qty-plus" data-amount="1">+</button>
                        </div>
                    </div>
                </div>
                <div class="ceq-box">
                    <div class="ceq-box-wrapper">
                        <div class="ceq-box-title">Período de alquiler</div>
                        <div class="ceq-tabs">
                            <button class="ceq-tab ${this.state.timeUnit === "semanas" ? "active" : ""}" data-action="set-unit" data-value="semanas">Semanas</button>
                            <button class="ceq-tab ${this.state.timeUnit === "meses" ? "active" : ""}" data-action="set-unit" data-value="meses">Meses</button>
                        </div>
                    </div>
                    <div class="ceq-counter-wrap">
                        <button class="ceq-c-btn" data-action="time-minus" data-amount="1">−</button>
                        <div class="ceq-c-val"><strong>${this.state.timeValue}</strong><span>${this.state.timeUnit}</span></div>
                        <button class="ceq-c-btn" data-action="time-plus" data-amount="1">+</button>
                    </div>
                    <div class="ceq-tip-card">
                        <div class="ceq-tip-icon">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 9.33337C10.1333 8.66671 10.4667 8.20004 11 7.66671C11.6667 7.06671 12 6.20004 12 5.33337C12 4.27251 11.5786 3.25509 10.8284 2.50495C10.0783 1.7548 9.06087 1.33337 8 1.33337C6.93913 1.33337 5.92172 1.7548 5.17157 2.50495C4.42143 3.25509 4 4.27251 4 5.33337C4 6.00004 4.13333 6.80004 5 7.66671C5.46667 8.13337 5.86667 8.66671 6 9.33337" stroke="#FE5000" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M6 12H10" stroke="#FE5000" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M6.6665 14.6666H9.33317" stroke="#FE5000" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="ceq-tip-content">
                            <span class="ceq-tip-text">Un tip: a más meses, tu cuota mensual baja.</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="ceq-layout-right">
                <div class="ceq-right-card">
                    <div class="ceq-circle">
                        <span class="ceq-circle-lbl">CUOTA MENSUAL</span>
                        <span class="ceq-circle-val">${this.config.currency_symbol}${Math.round(tPricePerPeriod)}</span>
                        <span class="ceq-circle-sub">${this.config.currency_symbol}${Math.round(pBase)} x ${this.state.quantity} ${qtyLabel}</span>
                    </div>
                    <div class="ceq-info-card">
                        <span class="ceq-info-label">SISTEMA OPERATIVO</span>
                        <span class="ceq-info-title">Viene con <br> <strong>Windows Pro</strong></span>
                        <span class="ceq-info-footer">Precios no incluyen IGV.</span>
                    </div>
                </div>
            </div>
        </div>`;
      return;
    }

    if (this.state.step === 4) {
      var proc = this.config.processors.find(
        (p) => p.id === this.state.processorId,
      );
      body.innerHTML = `
        <div class="ceq-step4-container">
            <div class="ceq-step4-top">
                <div class="ceq-step4-price-circle">
                    <div class="ceq-s4-lbl">Costo mensual<br>por laptop*</div>
                    <div class="ceq-s4-specs">${proc ? proc.label : "Core i5"} | 16GB RAM | 500 GB SSD</div>
                    <div class="ceq-s4-price"><span>${this.config.currency_symbol}</span> ${Math.round(pBase)}</div>
                    <div class="ceq-s4-disc">*El precio no incluye IGV.</div>
                </div>
                <div class="ceq-step4-images">
                    </div>
            </div>
            <div class="ceq-step4-features">
                <div class="ceq-feat-item">
                    <div class="ceq-feat-icon">
                      <img src="${cotizadorData.pluginUrl}img/servicio.png" alt="Especialista" class="ceq-step4-features-img" />
                    </div>
                    <p>Soporte técnico y<br>mantenimiento incluido</p>
                </div>
                <div class="ceq-feat-item">
                    <div class="ceq-feat-icon">
                      <img src="${cotizadorData.pluginUrl}img/portatil.png" alt="Especialista" class="ceq-step4-features-img" />
                    </div>
                    <p>Laptop de reemplazo<br>inmediata por fallas</p>
                </div>
                <div class="ceq-feat-item">
                    <div class="ceq-feat-icon">
                      <img src="${cotizadorData.pluginUrl}img/camion.png" alt="Especialista" class="ceq-step4-features-img" />
                    </div>
                    <p>Configuración y entrega<br>en tus oficinas</p>
                </div>
            </div>
        </div>`;
    }
  };

  CotizadorUI.prototype.renderFooter = function () {
    var footer = this.root.querySelector(".ceq-footer");
    if (this.state.step === 0) {
      footer.innerHTML = "";
      return;
    }

    var restartBtn =
      '<button class="ceq-btn-ghost" data-action="restart"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg> Volver a empezar</button>';

    if (this.state.step === 4) {
      footer.innerHTML = `
        <div class="ceq-s4-footer-wrap">
            <div class="ceq-s4-actions">
                <button class="ceq-btn-ghost-dark" data-action="back">← Volver</button>
                <button class="ceq-btn-primary ceq-s4-btn" data-action="open-modal">Quiero la cotización en mi correo →</button>
            </div>
            <div class="ceq-s4-manual-link">
                ¿Ya conoces lo que necesitas? <button data-action="go-manual">Cotiza aquí</button>
            </div>
        </div>
      `;
      return;
    }

    if (this.state.step === 5) {
      footer.innerHTML = restartBtn + "<div></div>";
      return;
    }

    var back =
      '<button class="ceq-btn-ghost" data-action="back"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Volver</button>';
    var nextBtn =
      '<button class="ceq-btn-primary" data-action="next" ' +
      (this.canContinue() ? "" : "disabled") +
      ">" +
      (this.state.step === 3 ? "Ver mi solución →" : "Continuar →") +
      "</button>";

    // Estructuramos el footer con contenedores para forzar que el enlace baje
    footer.innerHTML = `
        <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
                ${back}
                ${nextBtn}
            </div>
            <div class="ceq-s4-manual-link" style="text-align: center; margin-top: 24px;">
                ¿Ya conoces lo que necesitas? <button type="button" data-action="go-manual" style="background: none; border: none; cursor: pointer; color: inherit; font-family: inherit; font-size: inherit; padding: 0;">Cotiza aquí</button>
            </div>
        </div>
    `;
  };

  CotizadorUI.prototype.renderModal = function () {
    var modalRoot = this.root.querySelector(".ceq-modal-root");
    if (!this.state.isModalOpen) {
      modalRoot.innerHTML = "";
      return;
    }

    modalRoot.innerHTML = `
        <div class="ceq-modal-overlay">
            <div class="ceq-modal-box ceq-anim-container">
                <button type="button" class="ceq-modal-close" data-action="close-modal" style="z-index: 20;">
                    <svg style="width:20px;height:20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
                
                <form id="ceq-quote-form" class="form-wrapper">
                    <h3 class="ceq-modal-title">Recibe tu cotización</h3>
                    <p class="ceq-modal-desc">Te enviaremos un PDF formal con todos los detalles.</p>
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
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">WhatsApp (Opcional)</label>
                        <input type="tel" class="ceq-form-input" placeholder="+51 999 999 999">
                    </div>
                    <button type="submit" class="ceq-btn-primary ceq-btn-block">
                        <span class="btn-text">Enviar cotización</span>
                        <div class="loader"></div>
                    </button>
                </form>

                <div id="successView" class="success-wrapper">
                    <lottie-player 
                        src="${cotizadorData.pluginUrl}js/animacion.json" 
                        background="transparent" 
                        speed="1" 
                        style="width: 180px; height: 180px;" 
                        loop 
                        autoplay>
                    </lottie-player>
                    <h3 class="ceq-modal-title" style="margin-top:20px;">¡Cotización enviada!</h3>
                    <p class="ceq-modal-desc">Revisa tu bandeja de entrada.</p>
                    <button type="button" class="ceq-btn-primary ceq-s4-btn" data-action="close-modal" style="margin-top:20px;">Cerrar</button>
                </div>
            </div>
        </div>
      `;
  };

  CotizadorUI.prototype.getMatchedRule = function () {
    var v = this.state.timeValue,
      u = this.state.timeUnit,
      match = null;
    this.config.periods.forEach((p) => {
      if (
        p.unit === u &&
        v >= p.min_value &&
        (p.max_value === "" || v <= parseInt(p.max_value))
      )
        match = p;
    });
    return match;
  };

  CotizadorUI.prototype.getExtrasPrice = function () {
    var total = 0,
      self = this;
    var extRam = self.config.extras.find(
      (e) => e.id === self.state.selectedExtras.ram,
    );
    var extStorage = self.config.extras.find(
      (e) => e.id === self.state.selectedExtras.almacenamiento,
    );
    if (extRam) total += parseFloat(extRam.price) || 0;
    if (extStorage) total += parseFloat(extStorage.price) || 0;
    return total;
  };

  CotizadorUI.prototype.getBasePrice = function () {
    var rule = this.getMatchedRule();
    if (!rule || !this.state.processorId || !this.state.gamaId) return 0;
    var raw =
      this.config.prices[this.state.processorId]?.[this.state.gamaId]?.[
        rule.id
      ];
    var base = raw ? parseFloat(raw) : 0;
    return base + this.getExtrasPrice();
  };

  CotizadorUI.prototype.canContinue = function () {
    if (this.state.step === 1) return !!this.state.processorId;
    if (this.state.step === 2) return !!this.state.gamaId;
    if (this.state.step === 3)
      return !!this.getMatchedRule() && this.getBasePrice() > 0;
    return true;
  };

  CotizadorUI.prototype.normalizeConfig = function (cfg) {
    var r = cfg || {};
    return {
      currency_symbol: r.currency_symbol || "S/.",
      texts: r.texts || {},
      processors: r.processors || [],
      gamas: r.gamas || [],
      periods: r.periods || [],
      extras: r.extras || [],
      prices: r.prices || {},
    };
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initCotizadores);
  else initCotizadores();
})();
