package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.inventory.domain.Inventory;

import java.util.List;

public record GetAllOwnedInventoriesResponse(List<InventoryResponseWithoutOwnerAndManagers> ownedInventories) {}