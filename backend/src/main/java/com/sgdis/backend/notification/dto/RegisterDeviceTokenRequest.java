package com.sgdis.backend.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record RegisterDeviceTokenRequest(
        @NotBlank(message = "Token es requerido")
        String token,
        
        @NotBlank(message = "Tipo de dispositivo es requerido")
        String deviceType
) {}

