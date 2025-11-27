package com.sgdis.backend.verification.mapper;

import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.verification.application.dto.LatestVerificationResponse;
import com.sgdis.backend.verification.application.dto.VerificationResponse;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;

import java.util.List;

public final class VerificationMapper {

    private VerificationMapper() {}

    public static VerificationEntity toEntity(ItemEntity item, UserEntity user) {
        return VerificationEntity.builder()
                .item(item)
                .user(user)
                .photoUrl(null)
                .build();
    }

    public static VerificationResponse toDto(VerificationEntity entity) {
        ItemEntity item = entity.getItem();
        String itemName = null;
        Long inventoryId = null;
        String inventoryName = null;
        
        if (item != null) {
            itemName = item.getProductName();
            if (item.getInventory() != null) {
                inventoryId = item.getInventory().getId();
                inventoryName = item.getInventory().getName();
            }
        }
        
        return new VerificationResponse(
                entity.getId(),
                item != null ? item.getId() : null,
                item != null ? item.getLicencePlateNumber() : null,
                itemName,
                inventoryId,
                inventoryName,
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUser() != null ? entity.getUser().getFullName() : null,
                entity.getUser() != null ? entity.getUser().getEmail() : null,
                entity.getPhotoUrl(),
                entity.getCreatedAt()
        );
    }

    public static List<VerificationResponse> toDtoList(List<VerificationEntity> entities) {
        return entities.stream()
                .map(VerificationMapper::toDto)
                .toList();
    }

    public static LatestVerificationResponse toLatestDto(VerificationEntity entity) {
        ItemEntity item = entity.getItem();
        String itemName = null;
        Long inventoryId = null;
        String inventoryName = null;
        
        if (item != null) {
            itemName = item.getProductName();
            if (item.getInventory() != null) {
                inventoryId = item.getInventory().getId();
                inventoryName = item.getInventory().getName();
            }
        }
        
        // Determine status based on whether there is a photo
        String status = (entity.getPhotoUrl() != null && !entity.getPhotoUrl().isEmpty()) 
            ? "VERIFIED" 
            : "PENDING";
        
        return new LatestVerificationResponse(
                entity.getId(),
                item != null ? item.getId() : null,
                item != null ? item.getLicencePlateNumber() : null,
                itemName,
                inventoryId,
                inventoryName,
                entity.getUser() != null ? entity.getUser().getId() : null,
                entity.getUser() != null ? entity.getUser().getFullName() : null,
                entity.getUser() != null ? entity.getUser().getEmail() : null,
                entity.getCreatedAt(),
                entity.getPhotoUrl(),
                status
        );
    }

    public static List<LatestVerificationResponse> toLatestDtoList(List<VerificationEntity> entities) {
        return entities.stream()
                .map(VerificationMapper::toLatestDto)
                .toList();
    }
}

