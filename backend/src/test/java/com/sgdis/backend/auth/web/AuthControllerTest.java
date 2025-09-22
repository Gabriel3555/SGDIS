package com.sgdis.backend.auth.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
import com.sgdis.backend.auth.application.port.LoginUseCase;
import com.sgdis.backend.auth.application.port.RefreshTokenUseCase;
import com.sgdis.backend.auth.application.port.RegisterUseCase;
import com.sgdis.backend.user.domain.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private LoginUseCase loginUseCase;

    @MockBean
    private RefreshTokenUseCase refreshTokenUseCase;

    @MockBean
    private RegisterUseCase registerUseCase;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser
    void authenticate_WithValidRequest_ShouldReturnAuthResponse() throws Exception {
        // Given
        AuthRequest authRequest = new AuthRequest("testuser@example.com", "password123");
        AuthResponse authResponse = new AuthResponse(1L, "testuser@example.com", Role.USER, "Login successful", "jwt-token", "refresh-token", true);

        when(loginUseCase.login(any(AuthRequest.class))).thenReturn(authResponse);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.email").value("testuser@example.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.jwt").value("jwt-token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh-token"))
                .andExpect(jsonPath("$.status").value(true));
    }

    @Test
    @WithMockUser
    void authenticate_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Given
        AuthRequest invalidRequest = new AuthRequest("", ""); // Invalid due to @NotBlank

        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void refreshToken_WithValidRequest_ShouldReturnRefreshTokenResponse() throws Exception {
        // Given
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest("valid-refresh-token");
        RefreshTokenResponse refreshResponse = new RefreshTokenResponse("new-jwt-token");

        when(refreshTokenUseCase.refreshToken(any(RefreshTokenRequest.class))).thenReturn(refreshResponse);

        // When & Then
        mockMvc.perform(post("/api/v1/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.accessToken").value("new-jwt-token"));
    }

    @Test
    @WithMockUser
    void refreshToken_WithInvalidRequest_ShouldReturnBadRequest() throws Exception {
        // Given
        RefreshTokenRequest invalidRequest = new RefreshTokenRequest(""); // Invalid due to @NotBlank

        // When & Then
        mockMvc.perform(post("/api/v1/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest))
                        .with(csrf()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void refreshToken_WhenUseCaseThrowsException_ShouldReturnUnauthorized() throws Exception {
        // Given
        RefreshTokenRequest refreshRequest = new RefreshTokenRequest("invalid-token");

        when(refreshTokenUseCase.refreshToken(any(RefreshTokenRequest.class)))
                .thenThrow(new RuntimeException("Invalid token"));

        // When & Then
        mockMvc.perform(post("/api/v1/auth/token/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest))
                        .with(csrf()))
                .andExpect(status().isUnauthorized());
    }
}