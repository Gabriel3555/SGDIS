package com.sgdis.backend.cancellation.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AskForCancellationRequest(
        @NotNull(message = "El ID del item es obligatorio")
        List<Long> itemsId,
        @NotBlank(message = "La razón es obligatoria")
        String reason
) {}
