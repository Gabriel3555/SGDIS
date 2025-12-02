/**
 * Token Auto-Refresh Script
 * Este script maneja el refresh automático del JWT usando el refresh token almacenado en cookies.
 * Se ejecuta al cargar la página y cada 5 minutos.
 */

// Variable global para controlar si hay un refresh en progreso
let isRefreshing = false;
let refreshPromise = null;
let refreshInterval = null;
let tokenRefreshInitialized = false;

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

// Verificar si el JWT está expirado o próximo a expirar (dentro de 15 segundos)
function isTokenExpired() {
  const token = localStorage.getItem("jwt");
  
  // Si no hay token, considerarlo expirado
  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    return true;
  }

  try {
    // Verificar que el token tenga el formato correcto de JWT (3 partes separadas por puntos)
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.warn("Token JWT con formato inválido (no tiene 3 partes)");
      return true;
    }

    // Decodificar el payload del JWT (segunda parte)
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar que tenga el campo exp
    if (!payload.exp) {
      console.warn("Token JWT sin campo de expiración");
      return true;
    }
    
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    
    // Retorna true si el token expira en menos de 15 segundos (para testing con tokens de 30s)
    // Esto da margen suficiente para refrescar antes de que expire
    if (timeUntilExpiry < 15) {
      console.log(`⏰ Token expira en ${Math.round(timeUntilExpiry)}s, necesita refresh`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error al verificar expiración del token:", error.message);
    // Si hay cualquier error al decodificar, considerar el token inválido
    return true;
  }
}

// Función principal para refrescar el token JWT
async function refreshJWTToken(force = false) {
  // Si ya hay un refresh en progreso, esperar a que termine
  if (isRefreshing && refreshPromise) {
    console.log("Refresh en progreso, esperando...");
    return await refreshPromise;
  }

  // Verificar si el token necesita ser refrescado
  if (!force && !isTokenExpired()) {
    console.log("Token aún válido, no es necesario refrescar");
    return true;
  }

  const refreshTokenValue = getCookie("refreshToken");
  
  if (!refreshTokenValue) {
    console.log("No se encontró refresh token");
    // Limpiar localStorage y cookies
    localStorage.removeItem("jwt");
    document.cookie = "jwt=; path=/; max-age=0";
    // No redirigir inmediatamente aquí, dejar que el código que llama decida
    // Solo redirigir si es una llamada desde initTokenRefresh y no hay otra opción
    return false;
  }

  // Marcar que hay un refresh en progreso
  isRefreshing = true;
  
  // Crear la promesa de refresh
  refreshPromise = (async () => {
    try {
      console.log("🔄 Refrescando token JWT...");
      
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
        console.log("✅ Token JWT refrescado exitosamente");
        
        // El endpoint devuelve 'accessToken' según el DTO RefreshTokenResponse
        // Pero también puede venir como 'jwt' por compatibilidad
        const newToken = data.accessToken || data.jwt;
        
        // Verificar que el nuevo token sea válido
        if (!newToken || newToken === "undefined" || newToken === "null" || newToken.trim() === "") {
          console.error("❌ Token recibido del servidor es inválido");
          console.error("   Respuesta del servidor:", data);
          return false;
        }
        
        // Actualizar JWT en localStorage con el nuevo token
        localStorage.setItem("jwt", newToken);
        
        // Verificar que se guardó correctamente
        const savedToken = localStorage.getItem("jwt");
        if (savedToken !== newToken) {
          console.error("❌ Error al guardar token en localStorage");
          return false;
        }
        
        // También actualizar el JWT en la cookie para navegaciones de página
        // Expira en 30 segundos (para testing)
        document.cookie = `jwt=${newToken}; path=/; max-age=30; SameSite=Strict`;
        
        console.log("✅ Token guardado correctamente en localStorage y cookie");
        return true;
      } else if (response.status === 401 || response.status === 403) {
        // Token refresh inválido o expirado - limpiar y retornar false
        console.error("❌ Fallo al refrescar token - refresh token inválido o expirado");
        localStorage.removeItem("jwt");
        document.cookie = "jwt=; path=/; max-age=0"; // Eliminar JWT cookie
        document.cookie = "refreshToken=; path=/; max-age=0"; // Eliminar refresh token
        // No redirigir aquí, dejar que el código que llama decida cuándo redirigir
        return false;
      } else {
        // Otro error del servidor - no limpiar tokens, puede ser temporal
        console.error(`❌ Error del servidor al refrescar token: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Error al refrescar token:", error);
      // En caso de error de red, no redirigir inmediatamente
      // Podría ser un problema temporal de conexión
      // No limpiar tokens en caso de error de red, pueden ser temporales
      return false;
    } finally {
      // Liberar el lock
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return await refreshPromise;
}

// Función de inicialización que se ejecuta al cargar la página
async function initTokenRefresh() {
  // Evitar múltiples inicializaciones
  if (tokenRefreshInitialized) {
    console.log("Token refresh ya inicializado, omitiendo...");
    return;
  }

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
  let jwt = localStorage.getItem("jwt");
  
  // Si no hay token, intentar refrescar primero antes de redirigir
  if (!jwt || jwt === "undefined" || jwt === "null" || jwt.trim() === "") {
    console.log("No se encontró JWT en localStorage, intentando refrescar...");
    const refreshTokenValue = getCookie("refreshToken");
    
    // Si hay refresh token, intentar refrescar
    if (refreshTokenValue) {
      const refreshed = await refreshJWTToken(true);
      if (refreshed) {
        jwt = localStorage.getItem("jwt");
        console.log("✅ Token obtenido después de refresh en init");
      } else {
        // Si el refresh falla, esperar un momento antes de redirigir
        // para dar tiempo a que se complete cualquier operación en curso
        setTimeout(() => {
          const finalJwt = localStorage.getItem("jwt");
          const finalRefreshToken = getCookie("refreshToken");
          // Solo redirigir si realmente no hay token ni refresh token
          if ((!finalJwt || finalJwt === "undefined" || finalJwt === "null" || finalJwt.trim() === "") && !finalRefreshToken) {
            console.log("No se pudo obtener token y no hay refresh token, redirigiendo al login...");
            window.location.href = "/login.html";
          }
        }, 2000); // Aumentar el delay a 2 segundos para dar más tiempo
        // No retornar aquí, continuar con la inicialización
      }
    } else {
      // No hay refresh token, pero esperar un poco antes de redirigir
      // en caso de que el token se esté cargando desde otra fuente
      setTimeout(() => {
        const finalJwt = localStorage.getItem("jwt");
        const finalRefreshToken = getCookie("refreshToken");
        if ((!finalJwt || finalJwt === "undefined" || finalJwt === "null" || finalJwt.trim() === "") && !finalRefreshToken) {
          console.log("No se encontró token ni refresh token después de esperar, redirigiendo al login...");
          window.location.href = "/login.html";
        }
      }, 2000);
      // No retornar aquí, continuar con la inicialización
    }
  }

  // Si el token está expirado o próximo a expirar, refrescarlo inmediatamente
  // Pero no redirigir si falla, solo loguear el error
  if (jwt && jwt !== "undefined" && jwt !== "null" && jwt.trim() !== "" && isTokenExpired()) {
    console.log("Token expirado o próximo a expirar, refrescando...");
    try {
      await refreshJWTToken();
    } catch (error) {
      console.error("Error al refrescar token en init:", error);
      // No redirigir inmediatamente, puede ser un error temporal
    }
  }

  // Limpiar intervalo anterior si existe
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Configurar refresh automático cada 20 segundos (para testing)
  refreshInterval = setInterval(async () => {
    console.log("Ejecutando refresh automático de token...");
    try {
      await refreshJWTToken();
    } catch (error) {
      console.error("Error en refresh automático:", error);
      // No hacer nada, el siguiente intento puede funcionar
    }
  }, 20 * 1000); // 20 segundos

  tokenRefreshInitialized = true;
  console.log("Sistema de auto-refresh de tokens iniciado (cada 20 segundos)");
}

// Resetear el flag cuando se carga una nueva página
// Esto permite que se reinicialice en cada página, pero evita múltiples inicializaciones en la misma página
window.addEventListener('beforeunload', () => {
  tokenRefreshInitialized = false;
});

// Ejecutar la inicialización cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTokenRefresh);
} else {
  // DOMContentLoaded ya se disparó, ejecutar inmediatamente
  initTokenRefresh();
}

// Función auxiliar para obtener un token válido (refresca si es necesario)
async function getValidToken() {
  const currentToken = localStorage.getItem("jwt");
  
  // Si no hay token o es inválido, intentar refrescar
  if (!currentToken || currentToken === "undefined" || currentToken === "null" || currentToken.trim() === "") {
    console.log("🔍 No hay token válido en localStorage, intentando refrescar...");
    const refreshed = await refreshJWTToken(true);
    if (!refreshed) {
      console.error("❌ No se pudo refrescar el token");
      return null;
    }
    const newToken = localStorage.getItem("jwt");
    console.log("✅ Token obtenido después de refresh");
    return newToken;
  }
  
  // Si el token está por expirar o expirado, refrescarlo primero
  if (isTokenExpired()) {
    console.log("⚠️ Token expirado o por expirar, refrescando antes de la petición...");
    const refreshed = await refreshJWTToken(true);
    if (!refreshed) {
      console.error("❌ No se pudo refrescar el token expirado");
      return null;
    }
    const newToken = localStorage.getItem("jwt");
    console.log("✅ Token refrescado y listo para usar");
    return newToken;
  }
  
  console.log("✅ Token válido, usando existente");
  return currentToken;
}

// Función helper para hacer peticiones autenticadas con manejo automático de tokens
async function authenticatedFetch(url, options = {}) {
  // Obtener un token válido (refresca si es necesario)
  let token = await getValidToken();
  
  // Si no se pudo obtener token, retornar error
  if (!token) {
    const refreshTokenValue = getCookie("refreshToken");
    if (!refreshTokenValue) {
      // No hay refresh token, redirigir al login
      console.log("No hay token ni refresh token disponible, redirigiendo al login...");
      window.location.href = "/login.html";
      return Promise.reject(new Error("No authentication token available"));
    }
    // Intentar refrescar una vez más
    const refreshed = await refreshJWTToken(true);
    if (refreshed) {
      token = localStorage.getItem("jwt");
    } else {
      console.log("No se pudo refrescar el token, redirigiendo al login...");
      window.location.href = "/login.html";
      return Promise.reject(new Error("Failed to refresh token"));
    }
  }

  // Preparar headers con el token
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Hacer la petición
  let response = await fetch(url, {
    ...options,
    headers,
  });

  // Si recibimos 401 o 403, intentar refrescar el token y reintentar
  if (response.status === 401 || response.status === 403) {
    console.log(`Token rechazado (${response.status}), intentando refrescar...`);
    
    // Intentar refrescar el token
    const refreshed = await refreshJWTToken(true);
    
    if (refreshed) {
      // Obtener el nuevo token
      const newToken = localStorage.getItem("jwt");
      
      if (newToken) {
        // Reintentar la petición con el nuevo token
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        };
        
        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        
        // Si aún falla después del refresh, puede ser un problema de permisos
        if (response.status === 401 || response.status === 403) {
          console.error(`Petición rechazada después de refrescar token (${response.status})`);
          // No redirigir inmediatamente, puede ser un problema de permisos específico
          // Dejar que el código que llama maneje el error
        }
      } else {
        console.error("No se pudo obtener nuevo token después de refrescar");
        const refreshTokenValue = getCookie("refreshToken");
        if (!refreshTokenValue) {
          window.location.href = "/login.html";
        }
      }
    } else {
      // No se pudo refrescar, verificar si hay refresh token
      const refreshTokenValue = getCookie("refreshToken");
      if (!refreshTokenValue) {
        console.log("No se pudo refrescar y no hay refresh token, redirigiendo al login...");
        window.location.href = "/login.html";
      }
    }
  }

  return response;
}

// Interceptor global para fetch que maneja automáticamente el refresh de tokens
(function() {
  // Guardar la función fetch original
  const originalFetch = window.fetch;
  
  // Función helper para obtener el token del header
  function getTokenFromHeaders(headers) {
    if (!headers) return null;
    if (headers instanceof Headers) {
      return headers.get('Authorization') || headers.get('authorization');
    }
    return headers['Authorization'] || headers['authorization'];
  }
  
  // Función helper para actualizar el token en los headers
  function updateTokenInHeaders(headers, newToken) {
    if (headers instanceof Headers) {
      headers.set('Authorization', `Bearer ${newToken}`);
      return headers;
    } else {
      return {
        ...headers,
        'Authorization': `Bearer ${newToken}`,
      };
    }
  }
  
  // Sobrescribir fetch globalmente
  window.fetch = async function(url, options = {}) {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Verificar si es una petición a la API
    const isApiRequest = urlString.startsWith('/api/') || urlString.includes('/api/');
    
    // Verificar si la petición es al endpoint de refresh para evitar loops
    const isRefreshEndpoint = urlString.includes('/api/v1/auth/token/refresh');
    
    // Solo interceptar peticiones a la API (excepto el endpoint de refresh)
    if (isApiRequest && !isRefreshEndpoint) {
      // Siempre obtener un token válido antes de hacer la petición
      // Esto asegura que siempre usamos el token más reciente, incluso si ya hay uno en los headers
      let token = null;
      
      if (window.getValidToken && typeof window.getValidToken === 'function') {
        try {
          token = await window.getValidToken();
          if (token) {
            // Siempre actualizar los headers con el token válido
            options.headers = updateTokenInHeaders(options.headers || {}, token);
          } else {
            console.warn(`No se pudo obtener token válido para petición a ${urlString}`);
          }
        } catch (error) {
          console.error("Error al obtener token válido antes de petición:", error);
          // Fallback: intentar usar token del localStorage
          token = localStorage.getItem("jwt");
          if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
            options.headers = updateTokenInHeaders(options.headers || {}, token);
          }
        }
      } else {
        // Fallback: usar token del localStorage
        token = localStorage.getItem("jwt");
        if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
          options.headers = updateTokenInHeaders(options.headers || {}, token);
        } else {
          console.warn(`No hay token disponible para petición a ${urlString}`);
        }
      }
      
      // Verificar que tenemos un token antes de hacer la petición
      if (!token) {
        console.error(`⚠️ No hay token disponible para petición a ${urlString}`);
        // Intentar obtener token una vez más
        if (window.getValidToken && typeof window.getValidToken === 'function') {
          try {
            token = await window.getValidToken();
            if (token) {
              options.headers = updateTokenInHeaders(options.headers || {}, token);
            } else {
              console.error(`❌ No se pudo obtener token válido para ${urlString}`);
              // Retornar error en lugar de hacer la petición sin token
              return new Response(JSON.stringify({ error: "No authentication token available" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              });
            }
          } catch (error) {
            console.error(`❌ Error al obtener token para ${urlString}:`, error);
            return new Response(JSON.stringify({ error: "Failed to get authentication token" }), {
              status: 401,
              headers: { "Content-Type": "application/json" }
            });
          }
        }
      }
      
      // Hacer la petición
      // Asegurarse de que las opciones estén correctamente formateadas
      const fetchOptions = {
        ...options,
        headers: options.headers || {}
      };
      
      // Si headers es un objeto plano, asegurarse de que tenga Content-Type si no lo tiene
      if (!(fetchOptions.headers instanceof Headers)) {
        if (!fetchOptions.headers['Content-Type'] && !fetchOptions.headers['content-type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      }
      
      let response;
      try {
        response = await originalFetch(url, fetchOptions);
      } catch (fetchError) {
        // Si hay un error de red o CORS, loguearlo pero no fallar silenciosamente
        console.error(`Error en fetch para ${urlString}:`, fetchError);
        // Re-lanzar el error para que el código que llama pueda manejarlo
        throw fetchError;
      }
      
      // Si recibimos 401 o 403, intentar refrescar el token y reintentar
      if (response.status === 401 || response.status === 403) {
        console.log(`⚠️ Token rechazado (${response.status}) en ${urlString}, intentando refrescar...`);
        
        // Intentar refrescar el token
        if (window.refreshJWTToken && typeof window.refreshJWTToken === 'function') {
          const refreshed = await window.refreshJWTToken(true);
          
          if (refreshed) {
            // Obtener el nuevo token
            const newToken = await window.getValidToken();
            
            if (newToken) {
              console.log(`✅ Token refrescado, reintentando petición a ${urlString}`);
              // Actualizar el header de Authorization
              const newOptions = { ...options };
              newOptions.headers = updateTokenInHeaders(newOptions.headers || {}, newToken);
              
              // Reintentar la petición con el nuevo token
              response = await originalFetch(url, newOptions);
              
              // Si aún falla después del refresh, puede ser un problema de permisos
              if (response.status === 401 || response.status === 403) {
                console.error(`❌ Petición rechazada después de refrescar token (${response.status}) en ${urlString}`);
                console.error(`   Esto puede indicar un problema de permisos o que el token sigue siendo inválido`);
                // No redirigir inmediatamente, puede ser un problema de permisos específico
              } else {
                console.log(`✅ Petición exitosa después de refrescar token en ${urlString}`);
              }
            } else {
              console.error(`❌ No se pudo obtener nuevo token después de refrescar para ${urlString}`);
            }
          } else {
            // No se pudo refrescar, verificar si hay refresh token
            const refreshTokenValue = getCookie("refreshToken");
            if (!refreshTokenValue) {
              console.error(`❌ No se pudo refrescar y no hay refresh token para ${urlString}`);
              // No redirigir aquí, dejar que el código que llama maneje el error
            } else {
              console.error(`❌ No se pudo refrescar token (hay refresh token pero el refresh falló) para ${urlString}`);
            }
          }
        } else {
          console.error(`❌ refreshJWTToken no está disponible para ${urlString}`);
        }
      }
      
      return response;
    }
    
    // Para peticiones que no son a la API, usar fetch normal
    return originalFetch(url, options);
  };
})();

// Exponer funciones globalmente por si se necesitan en otros scripts
window.refreshJWTToken = refreshJWTToken;
window.isTokenExpired = isTokenExpired;
window.getValidToken = getValidToken;
window.authenticatedFetch = authenticatedFetch;

// Exponer originalFetch para casos donde se necesite bypass del interceptor
// Nota: originalFetch está en el scope de la IIFE, así que necesitamos exponerlo de otra forma
// Por ahora, authenticatedFetch debería ser suficiente

