// Utility functions for cookie management
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// Check if JWT is expired or about to expire (within 2 minutes)
function isTokenExpired() {
    const token = localStorage.getItem('jwt');
    if (!token) return true;

    try {
        // Simple JWT expiration check (you might want to use a JWT library)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        // Return true if token expires in less than 2 minutes (120 seconds)
        return (payload.exp - currentTime) < 120;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
}

// Refresh JWT token using refresh token from cookies
async function refreshToken() {
    const refreshTokenValue = getCookie('refreshToken');
    if (!refreshTokenValue) {
        console.log('No refresh token found, redirecting to login');
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('/api/v1/auth/token/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refreshToken: refreshTokenValue
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Token refreshed successfully');
            // Update JWT in localStorage
            localStorage.setItem('jwt', data.jwt);
            return true;
        } else {
            console.error('Token refresh failed, redirecting to login');
            window.location.href = '/index.html';
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        window.location.href = '/index.html';
        return false;
    }
}

function logout() {
    // Limpiar tokens - JWT en localStorage, refresh token en cookies
    localStorage.removeItem('jwt');
    // Clear refresh token from cookies (no JWT cookies to clear)
    document.cookie = 'refreshToken=; path=/; max-age=0';
    window.location.href = '/index';
}

// Auto-refresh token every 5 minutes or when needed
setInterval(async () => {
    if (isTokenExpired()) {
        console.log('Token expired or about to expire, refreshing...');
        await refreshToken();
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Initial token check when page loads
document.addEventListener('DOMContentLoaded', async function() {
    if (isTokenExpired()) {
        console.log('Token expired on page load, refreshing...');
        await refreshToken();
    }
});

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeSidebar = document.getElementById('closeSidebar');

if (menuToggle && sidebar && overlay && closeSidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
}

// Animate progress bars on load
window.addEventListener('load', () => {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 100);
    });
});

// Sidebar navigation
const sidebarItems = document.querySelectorAll('.sidebar-item');
sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
        sidebarItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Close sidebar on mobile after selection
        if (window.innerWidth < 1024) {
            if (sidebar && overlay) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
            }
        }
    });
});