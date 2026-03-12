/* ================================================================
   SENA PORTAL – MAIN JAVASCRIPT
   Módulos:
   01. Scroll Progress Bar
   02. Toast Notifications
   03. Accessibility Panel
   04. External Link Warning Modal
   05. Toast Triggers (data-toast attributes)
   06. External Link Triggers (data-external attributes)
   07. Init
================================================================ */

'use strict';

/* ================================================================
   01. SCROLL PROGRESS BAR
   Lee qué tan lejos está el usuario en el scroll y actualiza
   el ancho de la barra de progreso fija en el tope de la página.
================================================================ */
const ProgressBar = (() => {
  const bar = document.getElementById('progressBar');

  const update = () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
    bar.style.width = `${scrolled}%`;
  };

  const init = () => {
    if (!bar) return;
    window.addEventListener('scroll', update, { passive: true });
  };

  return { init };
})();


/* ================================================================
   02. TOAST NOTIFICATIONS
   Muestra un mensaje flotante temporal en la parte inferior
   de la pantalla para confirmar acciones al usuario.

   Uso:
     Toast.show('Mensaje aquí');            // info (oscuro)
     Toast.show('Mensaje aquí', 'success'); // verde
     Toast.show('Mensaje aquí', 'warning'); // ámbar
================================================================ */
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer = null;

  const ICONS = {
    success: '✅',
    warning: '⚠️',
    default: 'ℹ️',
  };

  /**
   * @param {string} message   - Texto a mostrar
   * @param {'success'|'warning'|''} type - Variante visual
   * @param {number} duration  - Milisegundos antes de ocultarse (default: 3000)
   */
  const show = (message, type = '', duration = 3000) => {
    if (!el) return;

    const icon = ICONS[type] ?? ICONS.default;
    el.textContent = `${icon} ${message}`;
    el.className = `toast show ${type}`.trim();

    clearTimeout(timer);
    timer = setTimeout(() => {
      el.className = 'toast';
    }, duration);
  };

  return { show };
})();


/* ================================================================
   03. ACCESSIBILITY PANEL
   Gestiona los botones del panel de accesibilidad lateral.
   Cada botón tiene un data-action que indica qué comportamiento
   debe activar o desactivar.

   Acciones disponibles:
     - large-text    → Aumenta tamaño base del texto en body
     - high-contrast → Aplica filtro de alto contraste
     - screen-reader → Muestra toast informativo (placeholder)
     - reduce-motion → Inyecta CSS que desactiva transiciones/animaciones
================================================================ */
const AccessibilityPanel = (() => {
  const MOTION_STYLE_ID = 'reduceMotionStyle';

  const handlers = {
    'large-text': (btn) => {
      const active = document.body.classList.toggle('large-text');
      btn.setAttribute('aria-pressed', active);
    },

    'high-contrast': (btn) => {
      const active = document.body.classList.toggle('high-contrast');
      btn.setAttribute('aria-pressed', active);
    },

    'screen-reader': (btn) => {
      // En producción: integrar con una librería como aria-live o nvda API
      Toast.show('Lector de pantalla activado (modo demo)', 'success');
      btn.setAttribute('aria-pressed', 'true');
    },

    'reduce-motion': (btn) => {
      const existing = document.getElementById(MOTION_STYLE_ID);
      if (existing) {
        existing.remove();
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        const style = document.createElement('style');
        style.id = MOTION_STYLE_ID;
        style.textContent = '* { animation: none !important; transition: none !important; }';
        document.head.appendChild(style);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
    },
  };

  const init = () => {
    document.querySelectorAll('.access-btn[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (handlers[action]) {
          handlers[action](btn);

          // Sincroniza clase .active para estilos CSS (excepto reduce-motion que lo hace solo)
          if (action !== 'reduce-motion') {
            btn.classList.toggle('active');
          }
        }
      });
    });
  };

  return { init };
})();


/* ================================================================
   04. EXTERNAL LINK WARNING MODAL
   Intercepta clics en enlaces/botones con data-external="URL"
   y muestra un modal de confirmación antes de abrir el enlace
   en una nueva pestaña.
================================================================ */
const ExternalLinkModal = (() => {
  const overlay   = document.getElementById('extWarning');
  const btnCancel = document.getElementById('extCancel');
  const btnGo     = document.getElementById('extContinue');
  let pendingUrl  = '';

  const open = (url) => {
    pendingUrl = url;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    btnGo.focus();
  };

  const close = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    pendingUrl = '';
  };

  const proceed = () => {
    if (pendingUrl) window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    close();
  };

  const init = () => {
    if (!overlay) return;

    btnCancel.addEventListener('click', close);
    btnGo.addEventListener('click', proceed);

    // Cerrar al hacer clic fuera del modal
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
    });
  };

  return { init, open };
})();


/* ================================================================
   05. TOAST TRIGGERS
   Busca todos los elementos con data-toast="mensaje" y
   data-toast-type="tipo" y les asigna el evento click.
================================================================ */
const ToastTriggers = (() => {
  const init = () => {
    document.querySelectorAll('[data-toast]').forEach((el) => {
      el.addEventListener('click', () => {
        Toast.show(el.dataset.toast, el.dataset.toastType ?? '');
      });
    });
  };

  return { init };
})();


/* ================================================================
   06. EXTERNAL LINK TRIGGERS
   Busca todos los elementos con data-external="URL" y muestra
   el modal de confirmación al hacer clic.
================================================================ */
const ExternalTriggers = (() => {
  const init = () => {
    document.querySelectorAll('[data-external]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        ExternalLinkModal.open(el.dataset.external);
      });
    });
  };

  return { init };
})();


/* ================================================================
   07. INIT
   Punto de entrada principal. Se ejecuta cuando el DOM está listo.
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ProgressBar.init();
  AccessibilityPanel.init();
  ExternalLinkModal.init();
  ToastTriggers.init();
  ExternalTriggers.init();
});

const LoginPanel = (() => {

  // Referencias al DOM
  const panel    = document.getElementById('loginPanel');
  const overlay  = document.getElementById('loginOverlay');
  const trigger  = document.getElementById('loginTrigger');
  const closeBtn = document.getElementById('loginClose');
  const form     = document.getElementById('loginForm');
  const submit   = document.getElementById('loginSubmit');

  const inputUsuario  = document.getElementById('inputUsuario');
  const inputPassword = document.getElementById('inputPassword');
  const togglePwd     = document.getElementById('togglePassword');

  // ── Apertura y cierre ─────────────────────────────────────────

  const open = () => {
    panel.classList.add('open');
    overlay.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // evita scroll del fondo
    inputUsuario.focus();
  };

  const close = () => {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    clearErrors();
  };

  // ── Validación de campos ──────────────────────────────────────

  const showError = (fieldId, errorId, message) => {
    document.getElementById(fieldId).classList.add('has-error');
    document.getElementById(errorId).textContent = message;
  };

  const clearError = (fieldId, errorId) => {
    document.getElementById(fieldId).classList.remove('has-error');
    document.getElementById(errorId).textContent = '';
  };

  const clearErrors = () => {
    clearError('fieldUsuario', 'errorUsuario');
    clearError('fieldPassword', 'errorPassword');
  };

  const validate = () => {
    let valid = true;
    clearErrors();

    if (!inputUsuario.value.trim()) {
      showError('fieldUsuario', 'errorUsuario', 'Ingresa tu documento o usuario.');
      valid = false;
    }

    if (!inputPassword.value) {
      showError('fieldPassword', 'errorPassword', 'Ingresa tu contraseña.');
      valid = false;
    } else if (inputPassword.value.length < 6) {
      showError('fieldPassword', 'errorPassword', 'La contraseña debe tener al menos 6 caracteres.');
      valid = false;
    }

    return valid;
  };

  // Validación inmediata al salir de cada campo (onblur)
  const attachFieldValidation = () => {
    inputUsuario.addEventListener('blur', () => {
      if (!inputUsuario.value.trim()) {
        showError('fieldUsuario', 'errorUsuario', 'Ingresa tu documento o usuario.');
      } else {
        clearError('fieldUsuario', 'errorUsuario');
      }
    });

    inputPassword.addEventListener('blur', () => {
      if (!inputPassword.value) {
        showError('fieldPassword', 'errorPassword', 'Ingresa tu contraseña.');
      } else if (inputPassword.value.length < 6) {
        showError('fieldPassword', 'errorPassword', 'La contraseña debe tener al menos 6 caracteres.');
      } else {
        clearError('fieldPassword', 'errorPassword');
      }
    });
  };

  // ── Mostrar / ocultar contraseña ──────────────────────────────

  const attachTogglePassword = () => {
    togglePwd.addEventListener('click', () => {
      const isPassword = inputPassword.type === 'password';
      inputPassword.type = isPassword ? 'text' : 'password';
      togglePwd.textContent = isPassword ? '🙈' : '👁';
      togglePwd.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
  };

  // ── Envío del formulario ──────────────────────────────────────

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Estado de carga
    submit.classList.add('loading');
    submit.disabled = true;

    // Simulación de llamada al servidor (reemplazar con fetch real)
    setTimeout(() => {
      submit.classList.remove('loading');
      submit.disabled = false;
      close();
      Toast.show('Sesión iniciada correctamente', 'success');
    }, 1800);
  };

  // ── Init ──────────────────────────────────────────────────────

  const init = () => {
    if (!panel || !trigger) return;

    trigger.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', close);

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) close();
    });

    form.addEventListener('submit', handleSubmit);
    attachFieldValidation();
    attachTogglePassword();
  };

  return { init };
})();
LoginPanel.init();

/* ================================================================
   08. se adapta a version moviles 
   al cambiar a movil la pagina se adapta.
================================================================ */
const btn = document.getElementById('menu-btn');
const menu = document.querySelector('.nav-menu');

btn.addEventListener('click', () => {
  menu.classList.toggle('visible');
});
