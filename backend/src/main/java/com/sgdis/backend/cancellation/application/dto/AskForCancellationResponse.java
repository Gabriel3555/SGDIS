package com.sgdis.backend.cancellation.application.dto;

import java.time.LocalDateTime;

public record AskForCancellationResponse(
        Long id,
        Long itemId,
        String itemName, // Opcional, útil para el front
        Long requesterId,
        String reason,
        LocalDateTime requestedAt,
        Boolean approved, // Debería ser false o null al inicio
        String statusMessage
        )
{}
