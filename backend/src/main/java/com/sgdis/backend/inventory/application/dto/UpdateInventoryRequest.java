package com.sgdis.backend.inventory.application.dto;

public record UpdateInventoryRequest(
        Long id,
        String location,
        String name,
        Boolean status
) {
}
