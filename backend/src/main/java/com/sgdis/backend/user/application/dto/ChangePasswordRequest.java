package com.sgdis.backend.user.application.dto;

import jakarta.validation.constraints.NotBlank;
import org.springframework.validation.annotation.Validated;

@Validated
public record ChangePasswordRequest(
        @NotBlank
        String oldPassword,
        @NotBlank
        String newPassword
) {
}
