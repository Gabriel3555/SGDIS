package com.sgdis.backend.cancellation.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record RefuseCancellationRequest(
        @NotNull(message = "El ID de cancellation es obligatoria")
        Long cancellationId,
        @NotBlank(message = "La retroalimentacion es obligatoria")
        String comment
) {}
