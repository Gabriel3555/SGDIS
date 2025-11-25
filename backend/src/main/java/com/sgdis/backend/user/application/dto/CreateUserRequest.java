package com.sgdis.backend.user.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateUserRequest(
        @NotBlank String fullName,
        String jobTitle,
        String laborDepartment,
        @NotBlank
        @Pattern(
                regexp = "^[A-Za-z0-9._%+-]+@(soy\\.sena\\.edu\\.co|sena\\.edu\\.co)$",
                message = "Email domain must be @soy.sena.edu.co or @sena.edu.co"
        )
        String email,
        @NotBlank String role,
        @NotBlank String password,
        Boolean status,
        @NotNull(message = "La institución es obligatoria") Long institutionId
){}
