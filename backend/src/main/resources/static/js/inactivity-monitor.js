/**
 * Sistema de Monitoreo de Inactividad
 * - Detecta 1 minuto de inactividad del usuario
 * - Muestra modal de advertencia con contador de 60 segundos
 * - Cierra sesión automáticamente si no hay respuesta
 */

// Helper function to get cookie value
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

class InactivityMonitor {
    constructor() {
        // Configuración de tiempos (en milisegundos)
        this.INACTIVITY_TIME = 1 * 60 * 1000; // 1 minuto
        this.WARNING_TIME = 60; // 60 segundos para el contador
        
        // Variables de control
        this.inactivityTimer = null;
        this.warningTimer = null;
        this.countdownInterval = null;
        this.failsafeTimer = null;
        this.remainingSeconds = this.WARNING_TIME;
        
        // Estado
        this.isWarningModalOpen = false;
        
        // Eventos que indican actividad del usuario
        this.activityEvents = [
            'mousedown',
            'mousemove',
            'keypress',
            'scroll',
            'touchstart',
            'click'
        ];
        
        // Inicializar
        this.init();
    }
    
    init() {
        // Crear el modal de advertencia
        this.createWarningModal();
        
        // Configurar listeners de actividad
        this.setupActivityListeners();
        
        // Iniciar el temporizador de inactividad
        this.resetInactivityTimer();
    }
    
    createWarningModal() {
        // Verificar si el modal ya existe
        if (document.getElementById('inactivityWarningModal')) {
            return;
        }
        
        const modalHTML = `
            <div id="inactivityWarningModal" 
                 class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center hidden" 
                 style="z-index: 10000;">
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
                    <!-- Icono de advertencia -->
                    <div class="text-center mb-6">
                        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                            <i class="fas fa-exclamation-triangle text-yellow-600 dark:text-yellow-400 text-3xl"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Sesión Inactiva
                        </h2>
                        <p class="text-gray-600 dark:text-gray-300 mb-4">
                            Tu sesión ha estado inactiva por un tiempo prolongado.
                        </p>
                    </div>
                    
                    <!-- Contador -->
                    <div id="inactivityCounterSection" class="p-6 mb-6 text-center">
                        <p class="text-gray-800 dark:text-gray-100 mb-2 font-bold text-lg">
                            Tu sesión se cerrará automáticamente en:
                        </p>
                        <div class="flex items-center justify-center gap-3">
                            <div class="countdown-card bg-white dark:bg-gray-700 rounded-lg px-6 py-3 shadow-lg border-2 border-gray-200 dark:border-gray-600">
                                <span id="inactivityCountdown" 
                                      class="text-4xl font-bold text-[#00AF00]">
                                    60
                                </span>
                                <span class="countdown-label text-sm text-gray-600 dark:text-gray-300 block mt-1 font-semibold">
                                    segundos
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Mensaje adicional -->
                    <p class="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
                        ¿Deseas continuar con tu sesión actual?
                    </p>
                    
                    <!-- Botones de acción -->
                    <div class="flex gap-3">
                        <button id="inactivityLogoutBtn" 
                                class="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-semibold flex items-center justify-center gap-2">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Cerrar Sesión</span>
                        </button>
                        <button id="inactivityStayBtn" 
                                class="flex-1 px-6 py-3 bg-gradient-to-r from-[#00AF00] to-[#008800] hover:from-[#008800] hover:to-[#006600] text-white rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg transform hover:scale-[1.02] active:scale-[0.98]">
                            <i class="fas fa-check-circle"></i>
                            <span>Permanecer Activo</span>
                        </button>
                    </div>
                    
                    <!-- Barra de progreso -->
                    <div class="mt-6">
                        <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div id="inactivityProgressBar" 
                                 class="h-full transition-all duration-1000 ease-linear"
                                 style="width: 100%; background-color: #00AF00;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar el modal en el body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar event listeners de los botones
        document.getElementById('inactivityStayBtn').addEventListener('click', () => {
            this.handleStayActive();
        });
        
        document.getElementById('inactivityLogoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Configurar observer para detectar cambios de tema
        this.setupThemeObserver();
    }
    
    setupThemeObserver() {
        // Observar cambios en la clase 'dark' del elemento html
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    this.updateModalTheme();
                }
            });
        });
        
        // Observar el elemento html
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Guardar el observer para limpiarlo después
        this.themeObserver = observer;
        
        // Aplicar tema inicial
        this.updateModalTheme();
    }
    
    updateModalTheme() {
        const modal = document.getElementById('inactivityWarningModal');
        if (!modal) return;
        
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        // Actualizar fondo del modal principal
        const modalContent = modal.querySelector('div > div');
        if (modalContent) {
            if (isDarkMode) {
                // Aplicar estilos para modo oscuro
                modalContent.style.backgroundColor = '#1E293B'; // slate-800
                modalContent.classList.remove('bg-white');
                modalContent.classList.add('bg-gray-800');
            } else {
                // Aplicar estilos para modo claro
                modalContent.style.backgroundColor = '#ffffff'; // white
                modalContent.classList.remove('bg-gray-800');
                modalContent.classList.add('bg-white');
            }
        }
        
        // Actualizar otros elementos del modal
        const iconBg = modal.querySelector('.bg-yellow-100');
        if (iconBg) {
            if (isDarkMode) {
                iconBg.style.backgroundColor = 'rgba(234, 179, 8, 0.2)';
            } else {
                iconBg.style.backgroundColor = '';
            }
        }
        
        // Actualizar textos
        const headings = modal.querySelectorAll('h2, h3');
        headings.forEach(heading => {
            if (isDarkMode) {
                heading.style.color = '#F1F5F9'; // slate-100
            } else {
                heading.style.color = '#1E293B'; // slate-800
            }
        });
        
        const paragraphs = modal.querySelectorAll('p');
        paragraphs.forEach(p => {
            if (isDarkMode) {
                p.style.color = '#CBD5E1'; // slate-300
            } else {
                p.style.color = '#475569'; // slate-600
            }
        });

        const mutedSpans = modal.querySelectorAll('.text-gray-600, .text-gray-500, .text-gray-300');
        mutedSpans.forEach(span => {
            if (isDarkMode) {
                span.style.color = '#CBD5E1';
            } else {
                span.style.color = '#475569';
            }
        });

        // Actualizar la card del contador
        const countdownCard = modal.querySelector('.countdown-card');
        if (countdownCard) {
            if (isDarkMode) {
                countdownCard.style.background = 'linear-gradient(145deg, rgba(51, 65, 85, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)';
                countdownCard.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                countdownCard.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.55), 0 5px 15px rgba(14, 116, 144, 0.25)';
            } else {
                countdownCard.style.background = 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)';
                countdownCard.style.borderColor = 'rgba(0, 175, 0, 0.15)';
                countdownCard.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.08), 0 6px 12px rgba(0, 175, 0, 0.1)';
            }
        }

        // Actualizar el botón de cerrar sesión
        const logoutBtn = modal.querySelector('#inactivityLogoutBtn');
        if (logoutBtn) {
            if (isDarkMode) {
                logoutBtn.style.background = 'linear-gradient(145deg, #1f2937 0%, #111827 100%)';
                logoutBtn.style.borderColor = 'rgba(148, 163, 184, 0.25)';
                logoutBtn.style.color = '#e2e8f0';
                logoutBtn.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.55)';
            } else {
                logoutBtn.style.background = 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)';
                logoutBtn.style.borderColor = '#cbd5e1';
                logoutBtn.style.color = '#475569';
                logoutBtn.style.boxShadow = '0 10px 20px rgba(15, 23, 42, 0.08)';
            }
        }

        // Actualizar la etiqueta del contador
        const countdownLabel = modal.querySelector('.countdown-label');
        if (countdownLabel) {
            if (isDarkMode) {
                countdownLabel.style.color = '#cbd5e1';
            } else {
                countdownLabel.style.color = '#475569';
            }
        }
    }
    
    setupActivityListeners() {
        // Agregar listeners para todos los eventos de actividad
        this.activityEvents.forEach(event => {
            document.addEventListener(event, () => {
                if (!this.isWarningModalOpen) {
                    this.resetInactivityTimer();
                }
            }, { passive: true });
        });
    }
    
    resetInactivityTimer() {
        // Limpiar el temporizador existente
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        // Iniciar nuevo temporizador de inactividad
        this.inactivityTimer = setTimeout(() => {
            this.showWarningModal();
        }, this.INACTIVITY_TIME);
    }
    
    showWarningModal() {
        const modal = document.getElementById('inactivityWarningModal');
        if (!modal) {
            return;
        }
        
        // Marcar que el modal está abierto
        this.isWarningModalOpen = true;
        
        // Mostrar el modal
        modal.classList.remove('hidden');
        
        // Aplicar tema actual al modal
        this.updateModalTheme();
        
        // Reproducir sonido de alerta (opcional)
        this.playAlertSound();
        
        // Resetear y comenzar el contador
        this.remainingSeconds = this.WARNING_TIME;
        
        // Usar setTimeout para asegurar que el DOM esté completamente actualizado
        setTimeout(() => {
            this.updateCountdownDisplay();
            this.updateProgressBar();
        }, 50);
        
        this.startCountdown();
        
        // FAILSAFE: Configurar un timeout adicional que forzará el cierre
        // incluso si el intervalo falla por alguna razón
        this.failsafeTimer = setTimeout(() => {
            if (this.isWarningModalOpen) {
                this.handleLogout();
            }
        }, (this.WARNING_TIME + 2) * 1000); // 2 segundos extra de margen
    }
    
    hideWarningModal() {
        const modal = document.getElementById('inactivityWarningModal');
        if (!modal) return;
        
        // Limpiar animaciones y estilos del contador
        const countdownElement = document.getElementById('inactivityCountdown');
        if (countdownElement) {
            countdownElement.classList.remove('animate-pulse', 'text-red-600', 'text-orange-600', 'text-yellow-600');
            countdownElement.classList.add('text-[#00AF00]');
            
            // Limpiar animación heartbeat del contenedor
            if (countdownElement.parentElement) {
                countdownElement.parentElement.classList.remove('heartbeat-animation');
            }
        }
        
        // Ocultar el modal
        modal.classList.add('hidden');
        
        // Marcar que el modal está cerrado
        this.isWarningModalOpen = false;
        
        // Detener el contador
        this.stopCountdown();
        
        // Limpiar el failsafe timer
        if (this.failsafeTimer) {
            clearTimeout(this.failsafeTimer);
            this.failsafeTimer = null;
        }
    }
    
    startCountdown() {
        // Limpiar cualquier contador existente
        this.stopCountdown();
        
        // Iniciar el intervalo de cuenta regresiva
        this.countdownInterval = setInterval(() => {
            this.remainingSeconds--;
            
            this.updateCountdownDisplay();
            this.updateProgressBar();
            
            // Si llegó a 0 o menos, cerrar sesión automáticamente
            if (this.remainingSeconds <= 0) {
                this.stopCountdown();
                this.handleLogout();
            }
        }, 1000);
    }
    
    stopCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    
    updateCountdownDisplay() {
        const countdownElement = document.getElementById('inactivityCountdown');
        if (countdownElement) {
            countdownElement.textContent = this.remainingSeconds;
            
            // Cambiar color según el tiempo restante
            if (this.remainingSeconds <= 10) {
                countdownElement.classList.add('text-red-600');
                countdownElement.classList.remove('text-[#00AF00]', 'text-orange-600', 'text-yellow-600');
                
                // Activar pulsación cuando quedan 5 segundos o menos
                if (this.remainingSeconds <= 5) {
                    countdownElement.classList.add('animate-pulse');
                    countdownElement.parentElement.classList.add('heartbeat-animation');
                }
            } else if (this.remainingSeconds <= 20) {
                countdownElement.classList.add('text-orange-600');
                countdownElement.classList.remove('text-[#00AF00]', 'text-yellow-600', 'text-red-600', 'animate-pulse');
            } else if (this.remainingSeconds <= 40) {
                countdownElement.classList.add('text-yellow-600');
                countdownElement.classList.remove('text-[#00AF00]', 'text-orange-600', 'text-red-600', 'animate-pulse');
            }
        }
    }
    
    updateProgressBar() {
        const progressBar = document.getElementById('inactivityProgressBar');
        if (progressBar) {
            const percentage = (this.remainingSeconds / this.WARNING_TIME) * 100;
            progressBar.style.width = percentage + '%';
            
            // Calcular color basado en el porcentaje de tiempo restante
            // Verde (#00AF00) -> Amarillo (#FFD700) -> Naranja (#FF8C00) -> Rojo (#FF0000)
            let color;
            
            if (percentage > 66) {
                // Verde a Amarillo
                const localPercentage = ((percentage - 66) / 34);
                const r = Math.round(0 + (255 - 0) * (1 - localPercentage));
                const g = Math.round(175 + (215 - 175) * (1 - localPercentage));
                const b = Math.round(0 + (0 - 0) * (1 - localPercentage));
                color = `rgb(${r}, ${g}, ${b})`;
            } else if (percentage > 33) {
                // Amarillo a Naranja
                const localPercentage = ((percentage - 33) / 33);
                const r = Math.round(255);
                const g = Math.round(215 + (140 - 215) * (1 - localPercentage));
                const b = Math.round(0);
                color = `rgb(${r}, ${g}, ${b})`;
            } else {
                // Naranja a Rojo
                const localPercentage = (percentage / 33);
                const r = Math.round(255);
                const g = Math.round(140 * localPercentage);
                const b = Math.round(0);
                color = `rgb(${r}, ${g}, ${b})`;
            }
            
            progressBar.style.backgroundColor = color;
        }
    }
    
    async handleStayActive() {
        // Obtener el refresh token de las cookies o localStorage
        let refreshTokenValue = getCookie("refreshToken");
        
        // Si no está en cookies, intentar obtenerlo de localStorage
        if (!refreshTokenValue) {
            refreshTokenValue = localStorage.getItem("refreshToken");
        }
        
        if (!refreshTokenValue) {
            console.error("No refresh token found in cookies or localStorage");
            this.showNotification('Error', 'No se pudo renovar la sesión. Redirigiendo...', 'error');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
            return;
        }

        try {
            // Llamar al endpoint de refresh token
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
                // Guardar el nuevo access token en localStorage
                // El endpoint devuelve 'accessToken' según el DTO RefreshTokenResponse
                const newAccessToken = data.accessToken || data.jwt;
                if (newAccessToken) {
                    localStorage.setItem("jwt", newAccessToken);
                    console.log("Token refreshed successfully");
                } else {
                    console.error("No access token in response");
                }
            } else {
                console.error("Token refresh failed");
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Error al renovar el token");
            }
        } catch (error) {
            console.error("Error refreshing token:", error);
            this.showNotification('Error', 'No se pudo renovar la sesión. Redirigiendo...', 'error');
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 2000);
            return;
        }
        
        // Ocultar el modal
        this.hideWarningModal();
        
        // Resetear el temporizador de inactividad
        this.resetInactivityTimer();
        
        // Mostrar notificación de confirmación
        this.showNotification('Sesión extendida', 'Tu sesión continuará activa.', 'success');
    }
    
    handleLogout() {
        // Detener todos los temporizadores
        this.stopCountdown();
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        if (this.failsafeTimer) {
            clearTimeout(this.failsafeTimer);
            this.failsafeTimer = null;
        }
        
        // Marcar que el modal está cerrado para prevenir múltiples ejecuciones
        this.isWarningModalOpen = false;
        
        // Ocultar el modal inmediatamente
        const modal = document.getElementById('inactivityWarningModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Mostrar notificación visual
        this.showNotification('Sesión cerrada', 'Tu sesión ha sido cerrada por inactividad.', 'info');
        
        // Ejecutar cierre de sesión inmediatamente
        // Limpiar tokens
        try {
            localStorage.removeItem('jwt');
            document.cookie = 'jwt=; path=/; max-age=0';
            document.cookie = 'refreshToken=; path=/; max-age=0';
        } catch (error) {
            // Error al limpiar tokens
        }
        
        // Redirigir después de un breve momento
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 500);
    }
    
    showNotification(title, message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-[10001] transform transition-all duration-300 ease-in-out`;
        
        const bgColor = type === 'success' ? 'bg-green-500' : 
                       type === 'error' ? 'bg-red-500' : 
                       'bg-blue-500';
        
        notification.innerHTML = `
            <div class="${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'} text-2xl"></i>
                <div>
                    <div class="font-bold">${title}</div>
                    <div class="text-sm opacity-90">${message}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    playAlertSound() {
        // Reproducir un sonido de alerta usando Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            // No se pudo reproducir el sonido
        }
    }
    
    // Método público para destruir el monitor (útil para testing o cleanup)
    destroy() {
        // Limpiar todos los temporizadores
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
        if (this.failsafeTimer) {
            clearTimeout(this.failsafeTimer);
            this.failsafeTimer = null;
        }
        this.stopCountdown();
        
        // Remover event listeners
        this.activityEvents.forEach(event => {
            document.removeEventListener(event, this.resetInactivityTimer);
        });
        
        // Desconectar el observer de tema
        if (this.themeObserver) {
            this.themeObserver.disconnect();
            this.themeObserver = null;
        }
        
        // Remover el modal
        const modal = document.getElementById('inactivityWarningModal');
        if (modal) {
            modal.remove();
        }
    }
}

// Inicializar el monitor cuando el DOM esté listo
// Solo inicializar si el usuario está autenticado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initInactivityMonitor();
    });
} else {
    initInactivityMonitor();
}

function initInactivityMonitor() {
    // Verificar si hay un token JWT (usuario autenticado)
    const jwt = localStorage.getItem('jwt');
    
    // Solo iniciar el monitor si el usuario está autenticado
    if (jwt) {
        // Crear instancia global del monitor
        window.inactivityMonitor = new InactivityMonitor();
    }
}

// Exportar la clase para uso externo si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InactivityMonitor;
}

