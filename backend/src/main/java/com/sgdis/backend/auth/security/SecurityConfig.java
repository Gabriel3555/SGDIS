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
                        // For API requests, return JSON error
                        if (request.getRequestURI().startsWith("/api/")) {
                            response.setContentType("application/json");
                            response.setStatus(403);
                            response.getWriter().write("{\"error\":\"Access denied\"}");
                        } else {
                            // For page requests, show error page
                            response.sendRedirect("/error.html");
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
                            "/js/**"
                    ).permitAll();
                    // Dashboard endpoints require authentication and proper roles
                    http.requestMatchers("/dashboard/user").hasRole("USER");
                    http.requestMatchers("/dashboard/admin_institution", "/dashboard/admininstitution").hasRole("ADMIN_INSTITUTION");
                    http.requestMatchers("/dashboard/warehouse").hasRole("WAREHOUSE");
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
        configuration.addAllowedOriginPattern("*");
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(false);

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
