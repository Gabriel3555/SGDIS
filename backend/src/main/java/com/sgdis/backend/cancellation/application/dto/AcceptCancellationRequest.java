package com.sgdis.backend.cancellation.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AcceptCancellationRequest(
        @NotNull(message = "Debe añadir el ID de la baja")
        Long cancellationId,
        @NotBlank(message = "Debe añadir una retroalimentacion")
        String comment
) {}
