// Toast notification functions
function showSuccessToast(title, message) {
    showToast(title, message, 'success');
}

function showErrorToast(title, message) {
    showToast(title, message, 'error');
}

function showInfoToast(title, message) {
    showToast(title, message, 'info');
}

function showWarningToast(title, message) {
    showToast(title, message, 'warning');
}

function showToast(title, message, type = 'info') {
    // Remove any existing toast
    const existingToast = document.querySelector('.custom-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `custom-toast custom-toast-${type}`;

    // Icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle text-2xl"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-times-circle text-2xl"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle text-2xl"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle text-2xl"></i>';
            break;
    }

    toast.innerHTML = `
        <div class="flex items-start gap-3">
            ${icon}
            <div class="flex-1">
                <div class="font-semibold text-lg mb-1">${title}</div>
                <div class="text-sm opacity-90">${message}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:opacity-70 transition-opacity">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Export functions
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;
window.showInfoToast = showInfoToast;
window.showWarningToast = showWarningToast;
window.showToast = showToast;

