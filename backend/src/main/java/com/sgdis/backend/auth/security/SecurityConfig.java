package com.sgdis.backend.auth.security;

import com.sgdis.backend.auth.security.filter.JwtTokenValidator;
import com.sgdis.backend.auth.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig  {

    private final JwtUtils jwtUtils;

    @Bean
    SecurityFilterChain securityFilterChain (HttpSecurity httpSecurity) throws Exception {
        httpSecurity
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(new JwtTokenValidator(jwtUtils), BasicAuthenticationFilter.class)
                .exceptionHandling(exceptions -> exceptions
                    .authenticationEntryPoint((request, response, authException) -> {
                        // Add CORS headers to error responses
                        String origin = request.getHeader("Origin");
                        if (origin != null && (origin.startsWith("http://localhost") || origin.contains("sgdis.cloud"))) {
                            response.setHeader("Access-Control-Allow-Origin", origin);
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                        }
                        // For API requests, return JSON error
                        if (request.getRequestURI().startsWith("/api/")) {
                            response.setContentType("application/json");
                            response.setStatus(401);
                            response.getWriter().write("{\"error\":\"Authentication required\"}");
                        } else {
                            // For page requests, redirect to error page
                            response.sendRedirect("/error.html");
                        }
                    })
                    .accessDeniedHandler((request, response, accessDeniedException) -> {
                        // Add CORS headers to error responses
                        String origin = request.getHeader("Origin");
                        if (origin != null && (origin.startsWith("http://localhost") || origin.contains("sgdis.cloud"))) {
                            response.setHeader("Access-Control-Allow-Origin", origin);
                            response.setHeader("Access-Control-Allow-Credentials", "true");
                        }
                        // For API requests, return JSON error
                        if (request.getRequestURI().startsWith("/api/")) {
                            response.setContentType("application/json");
                            response.setStatus(403);
                            response.getWriter().write("{\"error\":\"Access denied\"}");
                        } else {
                            // For page requests, redirect to home page
                            response.sendRedirect("/");
                        }
                    })
                )
                .authorizeHttpRequests(http -> {
                    http.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                    http.requestMatchers(HttpMethod.POST, "/api/v1/auth/**").permitAll();
                    http.requestMatchers(
                            "/swagger-ui/**",
                            "/v3/api-docs/**",
                            "/v3/api-docs.yaml",
                            "/static/**",
                            "/",
                            "/index",
                            "/register",
                            "/error.html",
                            "/forgot_password.html",
                            "/reset-password.html",
                            "/svg/**",
                            "/uploads/**",
                            "/css/**",
                            "/js/**",
                            "/ws/**"
                    ).permitAll();
                    // Dashboard endpoints require authentication and proper roles
                    http.requestMatchers("/dashboard/user").hasRole("USER");
                    // User routes require USER role
                    http.requestMatchers("/user/**").hasRole("USER");
                    http.requestMatchers("/dashboard/admin_institution", "/dashboard/admininstitution").hasRole("ADMIN_INSTITUTION");
                    http.requestMatchers("/dashboard/warehouse").hasRole("WAREHOUSE");
                    http.requestMatchers("/warehouse/dashboard").hasRole("WAREHOUSE");
                    http.requestMatchers("/warehouse/inventory").hasRole("WAREHOUSE");
                    http.requestMatchers("/warehouse/items").hasRole("WAREHOUSE");
                    http.requestMatchers("/warehouse/import-export").hasRole("WAREHOUSE");
                    // API endpoints require authentication
                    http.anyRequest().permitAll();
                });

        return httpSecurity.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow specific origins for development and production
        // When using credentials, we must specify exact origins, not patterns with wildcards
        configuration.addAllowedOrigin("http://localhost:8080");
        configuration.addAllowedOrigin("http://127.0.0.1:8080");
        configuration.addAllowedOrigin("http://localhost:3000");
        configuration.addAllowedOrigin("http://localhost:5173");
        configuration.addAllowedOrigin("https://sgdis.cloud");
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        // Allow credentials for authenticated requests
        // Note: When allowCredentials is true, you cannot use addAllowedOriginPattern("*")
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        // Expose headers that the frontend might need
        configuration.addExposedHeader("Authorization");
        configuration.addExposedHeader("Content-Type");
        configuration.addExposedHeader("X-Total-Count");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService){
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}
