package com.sgdis.backend.transfers.application.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequestTransferRequest(
        @NotNull(message = "El id del ítem es obligatorio")
        Long itemId,

        @NotNull(message = "El inventario de destino es obligatorio")
        Long destinationInventoryId,

        @Size(max = 500, message = "Las observaciones no pueden superar los 500 caracteres")
        String details
) {
}

