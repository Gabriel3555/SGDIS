package com.sgdis.backend.inventory.application.dto;

import java.util.UUID;

public record UpdateInventoryResponse(
        Long id,
        UUID uuid,
        String name,
        String location,
        String imgUrl
) {
}
