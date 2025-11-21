package com.sgdis.backend.cancellation.mapper;

import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;

public final class CancellationMapper {
    public static AskForCancellationResponse toResponse(CancellationEntity entity) {
        return new AskForCancellationResponse(
                entity.getId(),
                entity.getItem().getId(),
                entity.getItem().getProductName(),
                entity.getRequester().getId(),
                entity.getReason(),
                entity.getRequestedAt(),
                entity.getApproved(),
                "Solicitud de baja creada exitosamente"
        );
    }
}
