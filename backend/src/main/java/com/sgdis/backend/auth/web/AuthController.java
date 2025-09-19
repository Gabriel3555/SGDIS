package com.sgdis.backend.auth.web;

import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;
import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;
import com.sgdis.backend.auth.application.port.LoginUseCase;
import com.sgdis.backend.auth.application.port.RefreshTokenUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication endpoints")
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;

    @Operation(
            summary = "Sign in",
            description = "Validates credentials and returns an access token and a refresh token"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Successful login",
            content = @Content(schema = @Schema(implementation = AuthResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Invalid credentials")
    @PostMapping("/login")
    AuthResponse authenticate(@RequestBody @Valid AuthRequest authRequest) {
        return loginUseCase.login(authRequest);
    }

    @Operation(
            summary = "Refresh access token",
            description = "Generates a new access token using a valid refresh token"
    )
    @ApiResponse(
            responseCode = "200",
            description = "New access token issued",
            content = @Content(schema = @Schema(implementation = RefreshTokenResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    @PostMapping("/token/refresh")
    public ResponseEntity<RefreshTokenResponse> refreshToken(@RequestBody @Valid RefreshTokenRequest request) {
        return ResponseEntity.ok(refreshTokenUseCase.refreshToken(request));
    }
}