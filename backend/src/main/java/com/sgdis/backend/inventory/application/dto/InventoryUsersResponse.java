package com.sgdis.backend.inventory.application.dto;

public record InventoryUsersResponse(
        InventoryUserInfo owner,
        java.util.List<InventoryUserInfo> managers,
        java.util.List<InventoryUserInfo> signatories
) {}

