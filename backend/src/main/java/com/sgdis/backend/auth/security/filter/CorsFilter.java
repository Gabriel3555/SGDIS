package com.sgdis.backend.auth.security.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        String allowedOrigin = null;
        
        // Determine the origin to allow
        if (origin != null && !origin.isEmpty()) {
            // Cross-origin request - use the Origin header if allowed
            if (isAllowedOrigin(origin)) {
                allowedOrigin = origin;
            }
        } else {
            // Same-origin request - construct origin from request
            int port = request.getServerPort();
            String scheme = request.getScheme();
            String host = request.getServerName();
            
            String constructedOrigin;
            if ((scheme.equals("http") && port == 80) || (scheme.equals("https") && port == 443)) {
                constructedOrigin = scheme + "://" + host;
            } else {
                constructedOrigin = scheme + "://" + host + ":" + port;
            }
            
            // For same-origin requests to localhost, always allow
            if (constructedOrigin.contains("localhost") || constructedOrigin.contains("127.0.0.1") || isAllowedOrigin(constructedOrigin)) {
                allowedOrigin = constructedOrigin;
            }
        }
        
        // Add CORS headers if we have an allowed origin
        if (allowedOrigin != null) {
            response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
        }
        
        // Always add these headers
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With, Accept, Origin");
        response.setHeader("Access-Control-Expose-Headers", "Authorization, Content-Type, X-Total-Count");
        response.setHeader("Access-Control-Max-Age", "3600");

        // Handle preflight requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isEmpty()) return false;
        
        // Allow localhost with any port
        if (origin.startsWith("http://localhost") || origin.startsWith("https://localhost")) {
            return true;
        }
        // Allow 127.0.0.1 with any port
        if (origin.startsWith("http://127.0.0.1") || origin.startsWith("https://127.0.0.1")) {
            return true;
        }
        // Allow production domain
        if (origin.contains("sgdis.cloud")) {
            return true;
        }
        
        return false;
    }
}

