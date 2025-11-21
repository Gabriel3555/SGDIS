package com.sgdis.backend.cancellation.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AskForCancellationRequest(
        @NotNull(message = "El ID del item es obligatorio")
        Long itemId,
        @NotBlank(message = "La razón es obligatoria")
        String reason
) {}
