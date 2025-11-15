package com.sgdis.backend.inventory.application.dto;

import java.util.UUID;

public record AssignSignatoryInventoryResponse(AssignSignatoryInventoryUserResponse user, UUID inventoryId, String message, Boolean status) {}