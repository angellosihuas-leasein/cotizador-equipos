(function () {
  "use strict";

  function loadLottieScript() {
    var lottieUrl =
      "https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js";
    if (!document.querySelector('script[src="' + lottieUrl + '"]')) {
      var script = document.createElement("script");
      script.src = lottieUrl;
      script.async = true;
      document.head.appendChild(script);
    }
  }

  function initCotizadores() {
    loadLottieScript();
    
    // Inyectar CSS necesario para las nuevas animaciones y alertas
    var style = document.createElement('style');
    style.innerHTML = `
        @keyframes subtle-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-3px); }
            40% { transform: translateX(3px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
        }
        .animate-error-shake {
            animation: subtle-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        .error-container {
            display: grid;
            grid-template-rows: 0fr;
            transition: all 0.3s ease-in-out;
            opacity: 0;
            margin-top: 0;
        }
        .error-container.show-error {
            grid-template-rows: 1fr;
            opacity: 1;
            margin-top: 6px;
        }
        .error-inner {
            overflow: hidden;
        }
        .ceq-error-pill {
            display: inline-flex;
            align-items: flex-start;
            gap: 8px;
            background-color: rgba(254, 242, 242, 0.9);
            border: 1px solid #fee2e2;
            padding: 8px 12px;
            border-radius: 8px;
            backdrop-filter: blur(4px);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            width: max-content;
        }
        .ceq-error-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #ef4444;
            flex-shrink: 0;
            margin-top: 6px;
        }
        .ceq-error-text {
            font-size: 12px;
            font-weight: 500;
            color: #dc2626;
            line-height: 1.3;
        }
        .ceq-input-error {
            background-color: #ffffff !important;
            border-color: #fca5a5 !important;
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.05) !important;
        }
        /* Fix Loader */
        .loader {
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 3px solid #fff;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: none;
            margin: 0 auto;
        }
        .loading-btn .loader { display: block; }
        .loading-btn .btn-text { display: none; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

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
      mode: "smart",
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
    this.root.innerHTML =
      '<div class="ce-cotizador-wrapper">' +
      '<div class="ceq-stage">' +
      '<div class="ceq-header"></div>' +
      '<div class="ceq-body"></div>' +
      "</div>" + 
      '<div class="ceq-footer"></div>' + 
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

      if (action === "start-smart") {
        self.state.mode = "smart";
        self.goToStep(1);
      }
      if (action === "go-manual") {
        self.state.mode = "manual";
        if (!self.state.processorId && self.config.processors.length)
          self.state.processorId = self.config.processors[0].id;
        if (!self.state.gamaId && self.config.gamas.length)
          self.state.gamaId = self.config.gamas[0].id;
        self.goToStep(5);
      }

      if (action === "next" && self.canContinue()) {
        if (self.state.step === 3 || self.state.step === 5) {
          self.goToStep(4);
        } else {
          self.goToStep(self.state.step + 1);
        }
      }

      if (action === "back") {
        if (self.state.step === 1 || self.state.step === 5) {
          self.goToStep(0);
        } else if (self.state.step === 4) {
          self.goToStep(self.state.mode === "manual" ? 5 : 3);
        } else {
          self.goToStep(self.state.step - 1);
        }
      }

      if (action === "restart") {
        self.state.mode = "smart";
        self.state.step = 0;
        self.state.quantity = 1;
        self.state.timeValue = 1;
        self.state.selectedExtras = { ram: "", almacenamiento: "" };
        self.goToStep(0);
      }

      // Avance Automático
      if (action === "select-processor") {
        self.state.processorId = btn.getAttribute("data-value");
        self.renderBody(); 
        setTimeout(() => { if(self.canContinue()) self.goToStep(2); }, 400);
      }
      if (action === "select-gama") {
        self.state.gamaId = btn.getAttribute("data-value");
        self.renderBody();
        setTimeout(() => { if(self.canContinue()) self.goToStep(3); }, 400);
      }
      
      if (action === "set-unit") {
        self.state.timeUnit = btn.getAttribute("data-value");
        self.state.timeValue = 1;
        self.renderBody();
        self.renderFooter();
      }
      if (action === "time-minus") {
        self.state.timeValue = Math.max(1, self.state.timeValue - parseInt(btn.getAttribute("data-amount")));
        self.renderBody();
        self.renderFooter();
      }
      if (action === "time-plus") {
        self.state.timeValue = Math.min(999, self.state.timeValue + parseInt(btn.getAttribute("data-amount")));
        self.renderBody();
        self.renderFooter();
      }
      if (action === "qty-minus") {
        self.state.quantity = Math.max(1, self.state.quantity - parseInt(btn.getAttribute("data-amount")));
        self.renderBody();
        self.renderFooter();
      }
      if (action === "qty-plus") {
        self.state.quantity = Math.min(999, self.state.quantity + parseInt(btn.getAttribute("data-amount")));
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
    });

    // Validaciones de Entrada en Tiempo Real
    this.root.addEventListener("input", function(e) {
        if (e.target.name === "nombre") {
            e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "");
            self.clearError(e.target);
        }
        if (e.target.name === "ruc") {
             e.target.value = e.target.value.replace(/\D/g, ''); 
             self.clearError(e.target);
             
             if(e.target.value.length > 0 && e.target.value[0] !== '2') {
                 self.showError(e.target, "El RUC debe comenzar con 20");
             }
        }
        if (e.target.name === "telefono") {
            e.target.value = e.target.value.replace(/\D/g, '');
            self.clearError(e.target);
            
            if(e.target.value.length > 0 && e.target.value[0] !== '9') {
                 self.showError(e.target, "El número debe empezar con 9");
             }
        }
        if (e.target.name === "correo") {
            self.clearError(e.target);
        }
    });

    // Validar al perder el foco
    this.root.addEventListener("focusout", function(e) {
        if(e.target.name === "ruc" && e.target.value.length > 0 && e.target.value.length < 11) {
             self.showError(e.target, "El RUC debe tener 11 dígitos");
        }
        if(e.target.name === "telefono" && e.target.value.length > 0 && e.target.value.length < 9) {
             self.showError(e.target, "El número debe tener 9 dígitos");
        }
    });

    this.root.addEventListener("submit", async function (e) {
      if (e.target.id === "ceq-quote-form") {
        e.preventDefault();
        var formEl = e.target;
        
        // Anti-spam Honeypot Check
        var honeypot = formEl.querySelector('[name="website_url"]');
        if(honeypot && honeypot.value !== '') {
            console.warn("Bot detectado");
            return; // Bloqueo silencioso
        }

        var btn = formEl.querySelector('button[type="submit"]');
        var successEl = self.root.querySelector("#successView");

        if (!self.validateLocalFields(formEl)) return;

        btn.classList.add("loading-btn");
        btn.disabled = true;

        try {
            var rucInput = formEl.querySelector('[name="ruc"]');
            var rucValido = await self.validateRucAPI(rucInput.value);
            if (!rucValido) {
                self.showError(rucInput, "El RUC ingresado no existe en SUNAT.");
                btn.classList.remove("loading-btn");
                btn.disabled = false;
                return;
            }
            
            var formData = new FormData(formEl);
            formData.append('action', 'cotizador_enviar');
            formData.append('nonce', cotizadorWP.nonce);
            
            formData.append('procesador_id', self.state.processorId);
            formData.append('gama_id', self.state.gamaId);
            formData.append('cantidad', self.state.quantity);
            formData.append('tiempo_valor', self.state.timeValue);
            formData.append('tiempo_unidad', self.state.timeUnit);

            var resp = await fetch(cotizadorWP.ajax_url, {
                method: "POST",
                body: formData
            });

            var jsonResp = await resp.json();

            if (!jsonResp.success) {
                throw new Error(jsonResp.data.message || "Error en el envío");
            }

            formEl.classList.add("form-animate-out");
            successEl.classList.add("success-animate-in"); 

            var lottiePlayer = successEl.querySelector("lottie-player");
            if (lottiePlayer) {
              lottiePlayer.seek(0);
              lottiePlayer.play();
            }

        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al enviar la cotización: " + error.message);
            btn.classList.remove("loading-btn");
            btn.disabled = false;
        }
      }
    });
  };

  CotizadorUI.prototype.closeModal = function () {
    var self = this;
    var overlay = this.root.querySelector(".ceq-modal-overlay");
    var successView = this.root.querySelector("#successView");
    
    var isSuccessActive = successView && successView.classList.contains("success-animate-in");

    if (overlay) overlay.classList.add("is-closing");

    setTimeout(function () {
      self.state.isModalOpen = false;
      
      if (isSuccessActive) {
        self.state.step = 0;
        self.state.mode = "smart";
        self.state.quantity = 1;
        self.state.timeValue = 1;
        self.state.selectedExtras = { ram: "", almacenamiento: "" };
        self.state.processorId = null;
        self.state.gamaId = null;
        self.render();
      } else {
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
    var icons = {
      1: [
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
                    <img src="${typeof cotizadorData !== 'undefined' ? cotizadorData.pluginUrl : ''}img/yosellin.png" alt="Especialista" class="ceq-welcome-img" />
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
            '" target="_blank"><div class="wsp-wrapper-text"><span class="ceq-opt-icon"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1165_252)"><path d="M10.6916 1.81668C10.4744 1.71764 10.2385 1.66638 9.99989 1.66638C9.76123 1.66638 9.52536 1.71764 9.30822 1.81668L2.16656 5.06668C2.01868 5.13188 1.89295 5.23868 1.80469 5.37406C1.71643 5.50944 1.66943 5.66757 1.66943 5.82918C1.66943 5.99079 1.71643 6.14892 1.80469 6.2843C1.89295 6.41968 2.01868 6.52648 2.16656 6.59168L9.31656 9.85001C9.53369 9.94905 9.76956 10.0003 10.0082 10.0003C10.2469 10.0003 10.4828 9.94905 10.6999 9.85001L17.8499 6.60001C17.9978 6.53481 18.1235 6.42801 18.2118 6.29263C18.3 6.15725 18.347 5.99913 18.347 5.83751C18.347 5.6759 18.3 5.51777 18.2118 5.38239C18.1235 5.24701 17.9978 5.14022 17.8499 5.07501L10.6916 1.81668Z" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3334 14.7084L10.6917 18.175C10.4746 18.2741 10.2387 18.3253 10.0001 18.3253C9.76142 18.3253 9.52555 18.2741 9.30841 18.175L1.66675 14.7084" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3334 10.5416L10.6917 14.0083C10.4746 14.1073 10.2387 14.1586 10.0001 14.1586C9.76142 14.1586 9.52555 14.1073 9.30841 14.0083L1.66675 10.5416" stroke="#737373" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="clip0_1165_252"><rect width="20" height="20" fill="white"/></clipPath></defs></svg></span><span class="ceq-wa-text"><div class="wsp-option-chip-wrapper"><span class="ceq-wa-title">' +
            (t.whatsapp_label || "Quiero hablar con un especialista") +
            '</span><div class="wsp-option-chip">consultar</div></div><span class="ceq-wa-desc">' +
            (t.whatsapp_desc || "") +
            '</span></div></span><span style="color:#ea580c; font-size:24px; visibility: hidden;">→</span></a>'
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

    if (this.state.step === 5) {
      var procOptions = this.config.processors.map(function(p) {
          return '<option value="' + p.id + '" ' + (p.id === self.state.processorId ? 'selected' : '') + '>' + p.label + '</option>';
      }).join('');
      
      var gamaOptions = this.config.gamas.map(function(g) {
          return '<option value="' + g.id + '" ' + (g.id === self.state.gamaId ? 'selected' : '') + '>' + g.label + '</option>';
      }).join('');

      body.innerHTML = `
        <div class="ceq-layout-split">
            <div class="ceq-layout-left">
                <div class="ceq-box ceq-box-base">
                    <div class="ceq-box-eyebrow">Configura tu equipo</div>
                    <div class="ceq-box-base-wrapper">
                      <div style="margin-bottom: 16px; margin-top: 12px;">
                          <label style="display:block; font-size:12px; color:#737373; margin-bottom:4px; font-weight:600;">Procesador</label>
                          <select class="ceq-form-input" data-action="change-proc" style="width:100%; cursor:pointer;">
                              ${procOptions}
                          </select>
                      </div>
                      <div>
                          <label style="display:block; font-size:12px; color:#737373; margin-bottom:4px; font-weight:600;">Gama / Tipo de uso</label>
                          <select class="ceq-form-input" data-action="change-gama" style="width:100%; cursor:pointer;">
                              ${gamaOptions}
                          </select>
                      </div>
                    </div>
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
                      <img src="${typeof cotizadorData !== 'undefined' ? cotizadorData.pluginUrl : ''}img/servicio.svg" alt="Especialista" class="ceq-step4-features-img" />
                    </div>
                    <p>Soporte técnico y<br>mantenimiento incluido</p>
                </div>
                <div class="ceq-feat-item">
                    <div class="ceq-feat-icon">
                      <img src="${typeof cotizadorData !== 'undefined' ? cotizadorData.pluginUrl : ''}img/portatil.svg" alt="Especialista" class="ceq-step4-features-img" />
                    </div>
                    <p>Laptop de reemplazo<br>inmediata por fallas</p>
                </div>
                <div class="ceq-feat-item">
                    <div class="ceq-feat-icon">
                      <img src="${typeof cotizadorData !== 'undefined' ? cotizadorData.pluginUrl : ''}img/camion.svg" alt="Especialista" class="ceq-step4-features-img" />
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

    var t = this.config.texts || {};
    // Aquí puedes poner el número de WhatsApp oficial de Leasein
    var waUrl = t.whatsapp_url || "https://wa.me/51987146591"; 

    var back =
      '<button class="ceq-btn-ghost" data-action="back"><svg style="width:20px;height:20px;margin-right:8px;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg> Volver</button>';

    // --- NUEVO ENLACE A WHATSAPP ---
    var whatsappLinkHtml = `
        <div class="ceq-s4-manual-link" style="text-align: center; margin-top: 24px; font-size: 14px; color: #737373;">
            ¿Tienes dudas? <a href="${waUrl}" target="_blank" style="text-decoration: none; font-weight: 600;">Conversa con un especialista <img src="${typeof cotizadorData !== 'undefined' ? cotizadorData.pluginUrl : ''}img/whatsapp.svg" alt="WhatsApp Icon"></a>
        </div>`;

    if (this.state.step === 4) {
      footer.innerHTML = `
        <div class="ceq-s4-footer-wrap">
            <div class="ceq-s4-actions">
                <button class="ceq-btn-ghost-dark" data-action="back">← Volver</button>
                <button class="ceq-btn-primary ceq-s4-btn" data-action="open-modal">Quiero la cotización en mi correo →</button>
            </div>
            ${whatsappLinkHtml}
        </div>
      `;
      return;
    }

    var nextBtn = (this.state.step === 1 || this.state.step === 2) 
      ? "" 
      : '<button class="ceq-btn-primary" data-action="next" ' +
        (this.canContinue() ? "" : "disabled") +
        ">" +
        ((this.state.step === 3 || this.state.step === 5) ? "Ver mi solución →" : "Continuar →") +
        "</button>";

    footer.innerHTML = `
        <div style="width: 100%;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
                ${back}
                ${nextBtn}
            </div>
            ${whatsappLinkHtml}
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
                    
                    <div style="display: none !important;">
                        <input type="text" name="website_url" tabindex="-1" autocomplete="off">
                    </div>

                    <div class="ceq-form-group">
                        <label class="ceq-form-label">RUC *</label>
                        <input type="text" name="ruc" class="ceq-form-input" required placeholder="Ej: 20123456789" maxlength="11" autocomplete="off">
                        <div id="error-ruc" class="error-container">
                            <div class="error-inner">
                                <div class="ceq-error-pill">
                                    <div class="ceq-error-dot"></div>
                                    <span class="message-text ceq-error-text"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">Nombre completo *</label>
                        <input type="text" name="nombre" class="ceq-form-input" required placeholder="Juan Pérez" autocomplete="off">
                        <div id="error-nombre" class="error-container">
                            <div class="error-inner">
                                <div class="ceq-error-pill">
                                    <div class="ceq-error-dot"></div>
                                    <span class="message-text ceq-error-text"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">Correo corporativo *</label>
                        <input type="email" name="correo" class="ceq-form-input" required placeholder="juan@empresa.com" autocomplete="off">
                        <div id="error-correo" class="error-container">
                            <div class="error-inner">
                                <div class="ceq-error-pill">
                                    <div class="ceq-error-dot"></div>
                                    <span class="message-text ceq-error-text"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="ceq-form-group">
                        <label class="ceq-form-label">WhatsApp *</label>
                        <input type="tel" name="telefono" class="ceq-form-input" required placeholder="9XXXXXXXX" maxlength="9" autocomplete="off">
                        <div id="error-telefono" class="error-container">
                            <div class="error-inner">
                                <div class="ceq-error-pill">
                                    <div class="ceq-error-dot"></div>
                                    <span class="message-text ceq-error-text"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="ceq-btn-primary ceq-btn-block">
                        <span class="btn-text">Enviar cotización</span>
                        <div class="loader"></div>
                    </button>
                </form>

                <div id="successView" class="success-wrapper">
                    <lottie-player 
                        src="${typeof cotizadorData !== 'undefined' ? cotizadorData.pluginUrl : ''}js/animacion.json" 
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
    if (this.state.step === 3 || this.state.step === 5)
      return !!this.getMatchedRule() && this.getBasePrice() > 0 && !!this.state.processorId && !!this.state.gamaId;
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

// --- NUEVOS MÉTODOS DE VALIDACIÓN Y ENVÍO ---

  CotizadorUI.prototype.validateLocalFields = function (formEl) {
    var isValid = true;
    var ruc = formEl.querySelector('[name="ruc"]');
    var nombre = formEl.querySelector('[name="nombre"]');
    var correo = formEl.querySelector('[name="correo"]');
    var telefono = formEl.querySelector('[name="telefono"]');

    // Limpiar errores primero
    this.clearError(ruc);
    this.clearError(nombre);
    this.clearError(correo);
    this.clearError(telefono);

    // Validar RUC
    var rucVal = ruc.value.trim();
    if (!rucVal) {
        this.showError(ruc, "El RUC es requerido.");
        isValid = false;
    } else if (!/^20\d{9}$/.test(rucVal)) {
        this.showError(ruc, "El RUC debe comenzar con 20 y tener 11 dígitos numéricos.");
        isValid = false;
    }

    // Validar Nombre
    if(!nombre.value.trim()){
        this.showError(nombre, "El nombre completo es requerido.");
        isValid = false;
    }

    // Validar Correo Corporativo
    var emailVal = correo.value.trim();
    var emailDomain = emailVal.split("@")[1] || "";
    var invalidDomains = ["gmail.com", "hotmail.com", "outlook.com", "gmail.pe", "hotmail.pe", "outlook.pe", "yahoo.com"];
    
    if(!emailVal) {
        this.showError(correo, "El correo corporativo es requerido.");
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || invalidDomains.includes(emailDomain.toLowerCase())) {
        this.showError(correo, "Por favor, ingresa un correo corporativo válido.");
        isValid = false;
    }

    // Validar Teléfono
    var telVal = telefono.value.trim();
    if(!telVal){
        this.showError(telefono, "El número de WhatsApp es requerido.");
        isValid = false;
    } else if (!/^9\d{8}$/.test(telVal)) {
        this.showError(telefono, "El número debe empezar con 9 y tener 9 dígitos.");
        isValid = false;
    }

    return isValid;
  };

  CotizadorUI.prototype.showError = function(inputEl, message) {
      if(!inputEl) return;
      var errorContainer = document.getElementById('error-' + inputEl.name);
      if (errorContainer) {
          var errorText = errorContainer.querySelector('.message-text');
          errorText.textContent = message;
          
          inputEl.classList.add('ceq-input-error', 'animate-error-shake');
          errorContainer.classList.add('show-error');
          
          setTimeout(() => {
              inputEl.classList.remove('animate-error-shake');
          }, 400);
      }
  };

  CotizadorUI.prototype.clearError = function(inputEl) {
      if(!inputEl) return;
      var errorContainer = document.getElementById('error-' + inputEl.name);
      if (errorContainer) {
          inputEl.classList.remove('ceq-input-error');
          errorContainer.classList.remove('show-error');
      }
  };

  CotizadorUI.prototype.validateRucAPI = async function (rucValue) {
      try {
          var fd = new FormData();
          fd.append("action", "cotizador_validar_ruc");
          fd.append("nonce", cotizadorWP.nonce);
          fd.append("ruc", rucValue);

          var resp = await fetch(cotizadorWP.ajax_url, { 
              method: "POST", 
              body: fd 
          });
          
          var json = await resp.json();
          return json.success; 
      } catch (e) {
          console.error("Error validando RUC", e);
          return false;
      }
  };

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initCotizadores);
  else initCotizadores();
})();