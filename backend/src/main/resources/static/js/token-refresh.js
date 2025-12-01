/**
 * Token Auto-Refresh Script
 * Este script maneja el refresh automático del JWT usando el refresh token almacenado en cookies.
 * Se ejecuta al cargar la página y cada 5 minutos.
 */

// Función auxiliar para obtener una cookie por nombre
function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// Verificar si el JWT está expirado o próximo a expirar (dentro de 2 minutos)
function isTokenExpired() {
  const token = localStorage.getItem("jwt");
  if (!token) return true;

  try {
    // Decodificar el payload del JWT
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Date.now() / 1000;
    // Retorna true si el token expira en menos de 2 minutos (120 segundos)
    return payload.exp - currentTime < 120;
  } catch (error) {
    console.error("Error al verificar expiración del token:", error);
    return true;
  }
}

// Función principal para refrescar el token JWT
async function refreshJWTToken() {
  const refreshTokenValue = getCookie("refreshToken");
  
  if (!refreshTokenValue) {
    console.log("No se encontró refresh token, redirigiendo al login...");
    // Limpiar localStorage y cookies
    localStorage.removeItem("jwt");
    document.cookie = "jwt=; path=/; max-age=0";
    window.location.href = "/login.html";
    return false;
  }

  try {
    console.log("Refrescando token JWT...");
    
    const response = await fetch("/api/v1/auth/token/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: refreshTokenValue,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Token JWT refrescado exitosamente");
      
      // Actualizar JWT en localStorage con el nuevo token
      localStorage.setItem("jwt", data.jwt);
      
      // También actualizar el JWT en la cookie para navegaciones de página
      // Expira en 24 horas (86400 segundos)
      document.cookie = `jwt=${data.jwt}; path=/; max-age=86400; SameSite=Strict`;
      
      return true;
    } else {
      console.error("Fallo al refrescar token, redirigiendo al login");
      localStorage.removeItem("jwt");
      document.cookie = "jwt=; path=/; max-age=0"; // Eliminar JWT cookie
      document.cookie = "refreshToken=; path=/; max-age=0"; // Eliminar refresh token
      window.location.href = "/login.html";
      return false;
    }
  } catch (error) {
    console.error("Error al refrescar token:", error);
    // En caso de error de red, no redirigir inmediatamente
    // Podría ser un problema temporal de conexión
    return false;
  }
}

// Función de inicialización que se ejecuta al cargar la página
async function initTokenRefresh() {
  // Verificar si estamos en la página de login, si es así, no hacer nada
  if (window.location.pathname.includes("/login.html") || 
      window.location.pathname === "/login" ||
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html" ||
      window.location.pathname.includes("/register.html") ||
      window.location.pathname.includes("/forgot_password.html") ||
      window.location.pathname.includes("/reset-password.html")) {
    return;
  }

  // Verificar si hay un JWT válido
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    console.log("No se encontró JWT, redirigiendo al login...");
    window.location.href = "/login.html";
    return;
  }

  // Si el token está expirado o próximo a expirar, refrescarlo inmediatamente
  if (isTokenExpired()) {
    console.log("Token expirado o próximo a expirar, refrescando...");
    await refreshJWTToken();
  }

  // Configurar refresh automático cada 5 minutos (300000 ms)
  setInterval(async () => {
    console.log("Ejecutando refresh automático de token...");
    await refreshJWTToken();
  }, 5 * 60 * 1000); // 5 minutos

  console.log("Sistema de auto-refresh de tokens iniciado (cada 5 minutos)");
}

// Ejecutar la inicialización cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTokenRefresh);
} else {
  // DOMContentLoaded ya se disparó, ejecutar inmediatamente
  initTokenRefresh();
}

// Exponer funciones globalmente por si se necesitan en otros scripts
window.refreshJWTToken = refreshJWTToken;
window.isTokenExpired = isTokenExpired;

