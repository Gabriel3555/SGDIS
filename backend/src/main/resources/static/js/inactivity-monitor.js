/**
 * Sistema de Monitoreo de Inactividad
 * - Detecta 1 minuto de inactividad del usuario
 * - Muestra modal de advertencia con contador de 60 segundos
 * - Cierra sesión automáticamente si no hay respuesta
 */

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
        
        console.log('Sistema de monitoreo de inactividad inicializado');
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
                    <div id="inactivityCounterSection" class="rounded-xl p-6 mb-6 text-center" style="transition: background-color 1s ease;">
                        <p class="text-gray-800 dark:text-gray-100 mb-2 font-bold text-lg">
                            Tu sesión se cerrará automáticamente en:
                        </p>
                        <div class="flex items-center justify-center gap-3">
                            <div class="bg-white dark:bg-gray-700 rounded-lg px-6 py-3 shadow-lg border-2 border-gray-200 dark:border-gray-600">
                                <span id="inactivityCountdown" 
                                      class="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                                    60
                                </span>
                                <span class="text-sm text-gray-600 dark:text-gray-300 block mt-1 font-semibold">
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
                                 class="h-full bg-gradient-to-r from-yellow-400 to-red-500 transition-all duration-1000 ease-linear"
                                 style="width: 100%;"></div>
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
            console.error('❌ ERROR: No se encontró el modal de advertencia');
            return;
        }
        
        console.log('🔔 Mostrando modal de advertencia de inactividad');
        
        // Marcar que el modal está abierto
        this.isWarningModalOpen = true;
        
        // Mostrar el modal
        modal.classList.remove('hidden');
        
        // Inicializar el color de fondo del modal (verde al inicio)
        const modalContent = modal.querySelector('div > div');
        const counterSection = document.getElementById('inactivityCounterSection');
        
        if (modalContent) {
            modalContent.style.backgroundColor = 'rgb(220, 252, 231)'; // green-100
            modalContent.style.transition = 'background-color 1s ease, box-shadow 0.5s ease';
        }
        
        // Inicializar también la sección del contador en verde
        if (counterSection) {
            counterSection.style.backgroundColor = 'rgb(220, 252, 231)'; // green-100
        }
        
        // Reproducir sonido de alerta (opcional)
        this.playAlertSound();
        
        // Resetear y comenzar el contador
        this.remainingSeconds = this.WARNING_TIME;
        
        // Usar setTimeout para asegurar que el DOM esté completamente actualizado
        setTimeout(() => {
            this.updateCountdownDisplay();
            this.updateModalBackgroundColor(); // Actualizar color inmediatamente
        }, 50);
        
        this.startCountdown();
        
        // FAILSAFE: Configurar un timeout adicional que forzará el cierre
        // incluso si el intervalo falla por alguna razón
        this.failsafeTimer = setTimeout(() => {
            console.error('🚨 FAILSAFE ACTIVADO - Forzando cierre de sesión');
            if (this.isWarningModalOpen) {
                this.handleLogout();
            }
        }, (this.WARNING_TIME + 2) * 1000); // 2 segundos extra de margen
    }
    
    hideWarningModal() {
        const modal = document.getElementById('inactivityWarningModal');
        if (!modal) return;
        
        console.log('👋 Ocultando modal de advertencia');
        
        // Limpiar animaciones y estilos del contador
        const countdownElement = document.getElementById('inactivityCountdown');
        if (countdownElement) {
            countdownElement.classList.remove('animate-pulse', 'text-red-600', 'dark:text-red-400', 
                                              'text-orange-600', 'dark:text-orange-400');
            countdownElement.classList.add('text-yellow-600', 'dark:text-yellow-400');
            
            // Limpiar animación heartbeat del contenedor
            if (countdownElement.parentElement) {
                countdownElement.parentElement.classList.remove('heartbeat-animation');
            }
        }
        
        // Resetear el color de fondo del modal y la sección del contador
        const modalContent = modal.querySelector('div > div');
        const counterSection = document.getElementById('inactivityCounterSection');
        
        if (modalContent) {
            modalContent.style.backgroundColor = '';
            modalContent.style.boxShadow = '';
        }
        
        if (counterSection) {
            counterSection.style.backgroundColor = '';
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
            console.log('🛡️ Failsafe timer cancelado');
        }
    }
    
    startCountdown() {
        // Limpiar cualquier contador existente
        this.stopCountdown();
        
        console.log(`⏱️ Iniciando contador de ${this.WARNING_TIME} segundos`);
        
        // Iniciar el intervalo de cuenta regresiva
        this.countdownInterval = setInterval(() => {
            this.remainingSeconds--;
            console.log(`⏳ Tiempo restante: ${this.remainingSeconds} segundos`);
            
            this.updateCountdownDisplay();
            this.updateProgressBar();
            
            // Advertencia cuando quedan 10 segundos
            if (this.remainingSeconds === 10) {
                console.warn('⚠️ ¡Solo quedan 10 segundos!');
            }
            
            // Advertencia crítica cuando quedan 5 segundos
            if (this.remainingSeconds === 5) {
                console.error('🔴 ¡CRÍTICO! Solo quedan 5 segundos!');
            }
            
            // Si llegó a 0 o menos, cerrar sesión automáticamente
            if (this.remainingSeconds <= 0) {
                console.error('⏰ ¡TIEMPO AGOTADO! Ejecutando cierre de sesión...');
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
                countdownElement.classList.add('text-red-600', 'dark:text-red-400');
                countdownElement.classList.remove('text-yellow-600', 'dark:text-yellow-400', 'text-orange-600', 'dark:text-orange-400');
                
                // Activar pulsación cuando quedan 5 segundos o menos
                if (this.remainingSeconds <= 5) {
                    countdownElement.classList.add('animate-pulse');
                    // Agregar clase adicional para animación más intensa
                    countdownElement.parentElement.classList.add('heartbeat-animation');
                }
            } else if (this.remainingSeconds <= 30) {
                countdownElement.classList.add('text-orange-600', 'dark:text-orange-400');
                countdownElement.classList.remove('text-yellow-600', 'dark:text-yellow-400', 'animate-pulse');
            }
        }
        
        // Actualizar color de fondo del modal (gradiente verde -> rojo)
        this.updateModalBackgroundColor();
    }
    
    updateProgressBar() {
        const progressBar = document.getElementById('inactivityProgressBar');
        if (progressBar) {
            const percentage = (this.remainingSeconds / this.WARNING_TIME) * 100;
            progressBar.style.width = percentage + '%';
        }
    }
    
    updateModalBackgroundColor() {
        const modal = document.getElementById('inactivityWarningModal');
        if (!modal) {
            console.error('❌ No se encontró el modal');
            return;
        }
        
        const modalContent = modal.querySelector('div > div'); // El div interior del modal
        const counterSection = document.getElementById('inactivityCounterSection'); // Sección del contador
        
        if (!modalContent) {
            console.error('❌ No se encontró modalContent');
            return;
        }
        
        if (!counterSection) {
            console.warn('⚠️ No se encontró counterSection');
        }
        
        // Calcular porcentaje de tiempo restante (100% = verde, 0% = rojo)
        const percentage = (this.remainingSeconds / this.WARNING_TIME) * 100;
        console.log(`🎨 Actualizando color: ${this.remainingSeconds}s restantes (${percentage.toFixed(1)}%)`);

        
        // Interpolar entre verde (inicio) y rojo (final)
        // Verde: rgb(220, 252, 231) - green-100
        // Amarillo: rgb(254, 249, 195) - yellow-100
        // Naranja: rgb(255, 237, 213) - orange-100
        // Rojo: rgb(254, 226, 226) - red-100
        
        let r, g, b;
        
        if (percentage > 66) {
            // Verde a Amarillo
            const localPercentage = ((percentage - 66) / 34) * 100;
            r = Math.round(220 + (254 - 220) * (100 - localPercentage) / 100);
            g = Math.round(252 + (249 - 252) * (100 - localPercentage) / 100);
            b = Math.round(231 + (195 - 231) * (100 - localPercentage) / 100);
        } else if (percentage > 33) {
            // Amarillo a Naranja
            const localPercentage = ((percentage - 33) / 33) * 100;
            r = Math.round(254 + (255 - 254) * (100 - localPercentage) / 100);
            g = Math.round(249 + (237 - 249) * (100 - localPercentage) / 100);
            b = Math.round(195 + (213 - 195) * (100 - localPercentage) / 100);
        } else {
            // Naranja a Rojo
            const localPercentage = (percentage / 33) * 100;
            r = Math.round(255 + (254 - 255) * (100 - localPercentage) / 100);
            g = Math.round(237 + (226 - 237) * (100 - localPercentage) / 100);
            b = Math.round(213 + (226 - 213) * (100 - localPercentage) / 100);
        }
        
        const backgroundColor = `rgb(${r}, ${g}, ${b})`;
        console.log(`🎨 Aplicando color: ${backgroundColor}`);
        
        // Aplicar el color de fondo con transición suave al modal completo
        modalContent.style.transition = 'background-color 1s ease';
        modalContent.style.backgroundColor = backgroundColor;
        console.log(`✅ Color aplicado a modalContent`);
        
        // Aplicar el mismo color a la sección del contador
        if (counterSection) {
            counterSection.style.backgroundColor = backgroundColor;
            console.log(`✅ Color aplicado a counterSection`);
        } else {
            console.warn(`⚠️ counterSection no encontrado, no se pudo aplicar color`);
        }
        
        // Agregar sombra más intensa cuando el tiempo es crítico
        if (this.remainingSeconds <= 10) {
            modalContent.style.boxShadow = '0 25px 50px -12px rgba(239, 68, 68, 0.5)';
        } else if (this.remainingSeconds <= 30) {
            modalContent.style.boxShadow = '0 20px 40px -12px rgba(249, 115, 22, 0.4)';
        }
    }
    
    handleStayActive() {
        console.log('Usuario decidió permanecer activo');
        
        // Ocultar el modal
        this.hideWarningModal();
        
        // Resetear el temporizador de inactividad
        this.resetInactivityTimer();
        
        // Mostrar notificación de confirmación (opcional)
        this.showNotification('Sesión extendida', 'Tu sesión continuará activa.', 'success');
    }
    
    handleLogout() {
        console.log('🚪 Cerrando sesión por inactividad - CONTADOR TERMINADO');
        
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
        console.log('🔒 Limpiando tokens y cerrando sesión...');
        
        // Limpiar tokens
        try {
            localStorage.removeItem('jwt');
            document.cookie = 'refreshToken=; path=/; max-age=0';
            console.log('✅ Tokens eliminados correctamente');
        } catch (error) {
            console.error('❌ Error al limpiar tokens:', error);
        }
        
        // Redirigir después de un breve momento
        setTimeout(() => {
            console.log('🔄 Redirigiendo a página de login...');
            // NO usar la función logout() del dashboard porque muestra un modal de confirmación
            // Cerrar sesión directamente redirigiendo a la página de login
            console.log('🔗 Cerrando sesión y redirigiendo a página de login');
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
            console.log('No se pudo reproducir el sonido de alerta:', error);
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
        
        // Remover el modal
        const modal = document.getElementById('inactivityWarningModal');
        if (modal) {
            modal.remove();
        }
        
        console.log('Sistema de monitoreo de inactividad destruido');
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
        console.log('Monitor de inactividad activado');
    } else {
        console.log('Usuario no autenticado, monitor de inactividad no iniciado');
    }
}

// Exportar la clase para uso externo si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InactivityMonitor;
}

