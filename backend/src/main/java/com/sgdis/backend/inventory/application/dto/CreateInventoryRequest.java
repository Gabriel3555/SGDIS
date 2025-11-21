package com.sgdis.backend.inventory.application.dto;

public record CreateInventoryRequest(
    String location,
    String name,
    Boolean status
) {}
