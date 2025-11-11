package com.sgdis.backend.user.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;

@Validated
public record ChangePasswordToUserRequest(
        @NotNull
        Long id,
        @NotBlank
        String newPassword
) {
}
