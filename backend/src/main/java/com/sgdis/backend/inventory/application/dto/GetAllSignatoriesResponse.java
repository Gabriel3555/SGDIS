package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.user.application.dto.UserResponse;

import java.util.List;

public record GetAllSignatoriesResponse(
        InventoryResponse inventory,
        List<UserResponse> signatories
) {}
