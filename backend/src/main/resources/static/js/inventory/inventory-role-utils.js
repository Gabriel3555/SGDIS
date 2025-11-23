(function () {
    let cachedBasePath = null;

    function detectBasePath() {
        if (cachedBasePath) {
            return cachedBasePath;
        }

        const path = window.location.pathname || '';
        if (path.includes('/admininstitution')) {
            cachedBasePath = 'admininstitution';
        } else if (path.includes('/admin_institution')) {
            cachedBasePath = 'admin_institution';
        } else if (path.includes('/admin_regional')) {
            cachedBasePath = 'admin_regional';
        } else {
            cachedBasePath = 'superadmin';
        }
        return cachedBasePath;
    }

    function getAdminBasePath() {
        return detectBasePath();
    }

    function buildAdminUrl(targetPath = '') {
        let normalized = targetPath.trim();
        if (!normalized.startsWith('/')) {
            normalized = `/${normalized}`;
        }
        normalized = normalized.replace(/\/{2,}/g, '/');

        if (normalized === '/') {
            return `/${detectBasePath()}`;
        }

        const prefixRegex = /^\/(superadmin|admin_institution|admininstitution|admin_regional)(\/|$)/;
        if (prefixRegex.test(normalized)) {
            const basePath = detectBasePath();
            return normalized
                .replace(prefixRegex, (_, __, trailing) => `/${basePath}${trailing || ''}`)
                .replace(/\/{2,}/g, '/');
        }

        const basePath = detectBasePath();
        return `/${basePath}${normalized}`;
    }

    function updateSidebarLinksForRole() {
        const basePath = detectBasePath();
        if (basePath === 'superadmin') {
            return;
        }

        const links = document.querySelectorAll('a.sidebar-item');
        links.forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) {
                return;
            }

            if (href.startsWith('/superadmin')) {
                const updatedHref = buildAdminUrl(href);
                link.setAttribute('href', updatedHref);

                const onclickValue = link.getAttribute('onclick');
                if (onclickValue && onclickValue.includes('handleSidebarClick')) {
                    link.setAttribute('onclick', `handleSidebarClick(event, '${updatedHref}')`);
                }
            }
        });
    }

    window.getAdminBasePath = getAdminBasePath;
    window.buildAdminUrl = buildAdminUrl;
    window.updateSidebarLinksForRole = updateSidebarLinksForRole;

    document.addEventListener('DOMContentLoaded', updateSidebarLinksForRole);
})();

