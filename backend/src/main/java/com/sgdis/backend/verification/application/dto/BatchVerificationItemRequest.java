package com.sgdis.backend.verification.application.dto;

import jakarta.validation.constraints.NotBlank;
import org.springframework.web.multipart.MultipartFile;

public record BatchVerificationItemRequest(
        @NotBlank(message = "Licence plate number is required")
        String licencePlateNumber,
        
        MultipartFile photo
) {}
