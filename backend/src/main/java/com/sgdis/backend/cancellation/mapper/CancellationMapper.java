package com.sgdis.backend.cancellation.mapper;

import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.application.dto.CancellationResponse;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.item.application.dto.ItemDTO;
import com.sgdis.backend.item.mapper.ItemMapper;

import java.util.ArrayList;
import java.util.List;

public final class CancellationMapper {
    public static AskForCancellationResponse toResponse(CancellationEntity entity) {
        return new AskForCancellationResponse(
                entity.getId(),
                "Solicitud de baja creada exitosamente"
        );
    }

    public static CancellationResponse toDto(CancellationEntity entity) {
        if (entity == null) {
            return null;
        }
        
        List<CancellationResponse.ItemSummary> itemsSummary = new ArrayList<>();
        if (entity.getItems() != null && !entity.getItems().isEmpty()) {
            itemsSummary = entity.getItems().stream()
                    .filter(item -> item != null)
                    .map(item -> new CancellationResponse.ItemSummary(
                            item.getId(),
                            item.getLicencePlateNumber() != null ? item.getLicencePlateNumber() : "",
                            item.getProductName() != null ? item.getProductName() : 
                                (item.getWareHouseDescription() != null ? item.getWareHouseDescription() : ""),
                            item.getProductName() != null ? item.getProductName() : ""
                    ))
                    .toList();
        }

        return new CancellationResponse(
                entity.getId(),
                entity.getRequester() != null ? entity.getRequester().getId() : null,
                entity.getRequester() != null ? entity.getRequester().getFullName() : null,
                entity.getRequester() != null ? entity.getRequester().getEmail() : null,
                entity.getChecker() != null ? entity.getChecker().getId() : null,
                entity.getChecker() != null ? entity.getChecker().getFullName() : null,
                entity.getChecker() != null ? entity.getChecker().getEmail() : null,
                itemsSummary,
                entity.getReason() != null ? entity.getReason() : "",
                entity.getRequestedAt(),
                entity.getApprovedAt(),
                entity.getRefusedAt(),
                entity.getComment() != null ? entity.getComment() : "",
                entity.getApproved() != null ? entity.getApproved() : false,
                entity.getUrlFormat() != null ? entity.getUrlFormat() : "",
                entity.getUrlCorrectedExample() != null ? entity.getUrlCorrectedExample() : ""
        );
    }
}