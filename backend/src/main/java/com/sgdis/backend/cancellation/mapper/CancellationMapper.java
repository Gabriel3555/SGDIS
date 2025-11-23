package com.sgdis.backend.cancellation.mapper;

import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.item.application.dto.ItemDTO;
import com.sgdis.backend.item.mapper.ItemMapper;

public final class CancellationMapper {
    public static AskForCancellationResponse toResponse(CancellationEntity entity) {
        return new AskForCancellationResponse(
                entity.getId(),
                "Solicitud de baja creada exitosamente"
        );
    }
}