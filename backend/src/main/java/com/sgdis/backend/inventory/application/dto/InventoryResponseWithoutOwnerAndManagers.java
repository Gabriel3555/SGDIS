package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.user.domain.User;

import java.util.UUID;

public record InventoryResponseWithoutOwnerAndManagers(
        Long id,
        UUID uuid,
        String location,
        String name
) {}
