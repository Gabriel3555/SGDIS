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
                    Long userId = userIdClaim.asLong();
                    String roleString = roleClaim.asString();
                    GrantedAuthority role = new SimpleGrantedAuthority(roleString);

                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, Set.of(role)));
                }
            } catch (Exception e) {
                // Invalid token, do nothing
            }
        }

        filterChain.doFilter(request, response);
    }
}