package com.sgdis.backend.inventory.application.dto;


import java.util.List;

public record GetAllOwnedInventoriesResponse(List<InventoryResponseWithoutOwnerAndManagers> ownedInventories) {}