package com.sgdis.backend.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
import com.sgdis.backend.auth.application.port.LoginUseCase;
import com.sgdis.backend.auth.application.port.RefreshTokenUseCase;
import com.sgdis.backend.auth.application.port.RegisterUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
class AuthIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @MockBean
    private LoginUseCase loginUseCase;

    @MockBean
    private RefreshTokenUseCase refreshTokenUseCase;

    @MockBean
    private RegisterUseCase registerUseCase;

    @MockBean
    private UserDetailsService userDetailsService;

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void loginIntegrationTest_ShouldReturnAuthResponse() throws Exception {
        // Given
        AuthRequest authRequest = new AuthRequest("integrationuser", "password123");
        AuthResponse authResponse = new AuthResponse(
                1L,
                "integrationuser",
                "Login successful",
                "jwt-token-123",
                "refresh-token-456",
                true
        );

        when(loginUseCase.login(any(AuthRequest.class))).thenReturn(authResponse);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.username").value("integrationuser"))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.jwt").value("jwt-token-123"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token-456"))
                .andExpect(jsonPath("$.status").value(true));
    }

    @Test
    void refreshTokenIntegrationTest_ShouldReturnNewAccessToken() throws Exception {
        // Given
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest("valid-refresh-token-789");
        RefreshTokenResponse refreshResponse = new RefreshTokenResponse("new-access-token-101");

        when(refreshTokenUseCase.refreshToken(any(RefreshTokenRequest.class))).thenReturn(refreshResponse);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.accessToken").value("new-access-token-101"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void securedEndpoint_ShouldBeAccessibleWithAuthentication() throws Exception {
        // This test verifies that the security configuration allows authenticated requests
        // In a real scenario, you would test an actual secured endpoint
        // For now, we just verify the setup works
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"test\",\"password\":\"test\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void loginWithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Given
        AuthRequest invalidRequest = new AuthRequest("", ""); // Empty fields should trigger validation

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void refreshTokenWithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Given
        RefreshTokenRequest invalidRequest = new RefreshTokenRequest(""); // Empty token should trigger validation

        // When & Then
        mockMvc.perform(post("/api/v1/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}