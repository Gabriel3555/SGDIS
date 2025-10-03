package com.sgdis.backend.inventory.application.dto;

import java.util.UUID;

public record AssignManagerInventoryResponse(AssignManagerInventoryUserResponse user, UUID inventoryId, String message, Boolean status) {}