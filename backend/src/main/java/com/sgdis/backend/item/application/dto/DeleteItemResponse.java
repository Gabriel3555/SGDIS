package com.sgdis.backend.item.application.dto;

public record DeleteItemResponse(
        Long itemId,
        String itemName,
        String message
) {
    // This response is now used for deactivating items (soft delete)
    // The message will indicate successful deactivation
}

