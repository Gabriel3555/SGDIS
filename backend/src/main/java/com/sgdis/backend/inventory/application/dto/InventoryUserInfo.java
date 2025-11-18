package com.sgdis.backend.inventory.application.dto;

public record InventoryUserInfo(
        Long userId,
        String fullName,
        String imgUrl
) {}

