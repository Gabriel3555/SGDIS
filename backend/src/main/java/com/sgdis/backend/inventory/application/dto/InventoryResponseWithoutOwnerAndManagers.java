package com.sgdis.backend.inventory.application.dto;


import java.util.UUID;

public record InventoryResponseWithoutOwnerAndManagers(
        Long id,
        UUID uuid,
        String location,
        String name
) {}
