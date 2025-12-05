/**
 * Dark Mode Manager
 * Maneja el cambio entre modo claro y oscuro, guardando la preferencia en localStorage
 */

class DarkModeManager {
  constructor() {
    this.storageKey = "sgdis-dark-mode";
    this.isDarkMode = this.loadPreference();
    this.init();
  }

  /**
   * Carga la preferencia guardada del localStorage
   */
  loadPreference() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved !== null) {
      return saved === "true";
    }
    // Si no hay preferencia guardada, usar la preferencia del sistema
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }

  /**
   * Guarda la preferencia en localStorage
   */
  savePreference(isDark) {
    localStorage.setItem(this.storageKey, isDark.toString());
  }

  /**
   * Aplica el modo oscuro al documento
   */
  applyDarkMode(isDark) {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    this.isDarkMode = isDark;
    this.savePreference(isDark);
    this.updateToggleButton();

    // Notificar a los componentes que el tema ha cambiado
    this.notifyThemeChange(isDark);
  }

  /**
   * Notifica a los componentes registrados sobre el cambio de tema
   */
  notifyThemeChange(isDark) {
    // Disparar evento personalizado para que otros componentes puedan escucharlo
    const event = new CustomEvent("themeChanged", {
      detail: { isDarkMode: isDark },
    });
    document.dispatchEvent(event);

    // Actualizar árbol de inventario si está visible
    if (typeof window.refreshInventoryTreeTheme === "function") {
      window.refreshInventoryTreeTheme();
    }
  }

  /**
   * Alterna entre modo claro y oscuro
   */
  toggle() {
    this.applyDarkMode(!this.isDarkMode);
  }

  /**
   * Actualiza el estado visual del botón toggle
   */
  updateToggleButton() {
    const toggleButton = document.getElementById("darkModeToggle");
    if (!toggleButton) return;

    // Si es un checkbox, actualizar su estado checked
    if (toggleButton.type === "checkbox") {
      toggleButton.checked = this.isDarkMode;
      toggleButton.setAttribute("aria-label", this.isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      return;
    }

    // Si es un botón con iconos (comportamiento anterior)
    const sunIcon = toggleButton.querySelector(".sun-icon");
    const moonIcon = toggleButton.querySelector(".moon-icon");

    if (this.isDarkMode) {
      // Modo oscuro activo - mostrar sol
      if (sunIcon) sunIcon.classList.remove("hidden");
      if (moonIcon) moonIcon.classList.add("hidden");
      toggleButton.setAttribute("aria-label", "Cambiar a modo claro");
    } else {
      // Modo claro activo - mostrar luna
      if (sunIcon) sunIcon.classList.add("hidden");
      if (moonIcon) moonIcon.classList.remove("hidden");
      toggleButton.setAttribute("aria-label", "Cambiar a modo oscuro");
    }
  }

  /**
   * Inicializa el modo oscuro
   */
  init() {
    // Aplicar el modo guardado al cargar la página
    this.applyDarkMode(this.isDarkMode);

    // Escuchar cambios en la preferencia del sistema (opcional)
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      // Solo aplicar si no hay preferencia guardada
      if (localStorage.getItem(this.storageKey) === null) {
        mediaQuery.addEventListener("change", (e) => {
          this.applyDarkMode(e.matches);
        });
      }
    }

    // Agregar event listener al botón toggle si existe
    const toggleButton = document.getElementById("darkModeToggle");
    if (toggleButton) {
      // Si es un checkbox, usar evento 'change'
      if (toggleButton.type === "checkbox") {
        toggleButton.addEventListener("change", () => this.toggle());
      } else {
        // Si es un botón, usar evento 'click'
        toggleButton.addEventListener("click", () => this.toggle());
      }
    }
  }
}

// Inicializar el gestor de modo oscuro cuando el DOM esté listo
let darkModeManager;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    darkModeManager = new DarkModeManager();
  });
} else {
  darkModeManager = new DarkModeManager();
}

// Uso global
window.darkModeManager = darkModeManager;
