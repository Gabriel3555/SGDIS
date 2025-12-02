package com.sgdis.backend.auth.security.filter;

import com.sgdis.backend.auth.utils.JwtUtils;
import com.auth0.jwt.interfaces.Claim;
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

public class JwtTokenValidator extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    public JwtTokenValidator(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {

        // Add CORS headers for same-origin requests (when Origin header is not present)
        String origin = request.getHeader("Origin");
        if (origin == null || origin.isEmpty()) {
            // Same-origin request - add CORS headers to allow the request
            String requestOrigin = request.getScheme() + "://" + request.getServerName() + 
                                 (request.getServerPort() != 80 && request.getServerPort() != 443 ? 
                                  ":" + request.getServerPort() : "");
            if (requestOrigin.contains("localhost") || requestOrigin.contains("127.0.0.1")) {
                response.setHeader("Access-Control-Allow-Origin", requestOrigin);
                response.setHeader("Access-Control-Allow-Credentials", "true");
            }
        }

        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = null;

        // Check Authorization header first
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            token = header.substring(7);
        }

        // If no token in header, check cookie
        if (token == null) {
            jakarta.servlet.http.Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (jakarta.servlet.http.Cookie cookie : cookies) {
                    if ("jwt".equals(cookie.getName())) {
                        token = cookie.getValue();
                        break;
                    }
                }
            }
        }

        if (token != null) {
            try {
                DecodedJWT decodedJWT = jwtUtils.verifyToken(token);
                Claim userIdClaim = decodedJWT.getClaim("userId");
                Claim roleClaim = decodedJWT.getClaim("role");

                if (userIdClaim != null && roleClaim != null) {
                    Long userId = null;
                    // Try to get userId as Long first
                    if (!userIdClaim.isNull()) {
                        try {
                            userId = userIdClaim.asLong();
                        } catch (Exception e) {
                            // If asLong() fails, try as String and parse
                            try {
                                String userIdStr = userIdClaim.asString();
                                if (userIdStr != null) {
                                    userId = Long.parseLong(userIdStr);
                                }
                            } catch (Exception e2) {
                                // If both fail, try as Number
                                try {
                                    Number userIdNum = userIdClaim.as(Number.class);
                                    if (userIdNum != null) {
                                        userId = userIdNum.longValue();
                                    }
                                } catch (Exception e3) {
                                    System.err.println("JwtTokenValidator: Error parsing userId from token: " + e3.getMessage());
                                }
                            }
                        }
                    }
                    
                    if (userId != null) {
                        String roleString = roleClaim.asString();
                        // Spring Security requires roles to have "ROLE_" prefix when using hasRole()
                        // But when setting in SecurityContext, we use the full "ROLE_" prefix
                        String roleWithPrefix = roleString.startsWith("ROLE_") ? roleString : "ROLE_" + roleString;
                        GrantedAuthority role = new SimpleGrantedAuthority(roleWithPrefix);
                        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, Set.of(role)));
                        System.out.println("JwtTokenValidator: Authentication set for userId=" + userId + ", role=" + roleWithPrefix);
                    } else {
                        System.err.println("JwtTokenValidator: userId is null after parsing token");
                    }
                } else {
                    System.err.println("JwtTokenValidator: userIdClaim or roleClaim is null");
                }
            } catch (Exception e) {
                // Invalid token - log for debugging
                System.err.println("JwtTokenValidator: Error validating token: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.err.println("JwtTokenValidator: No token found in request");
        }

        filterChain.doFilter(request, response);
    }
}