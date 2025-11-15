package com.sgdis.backend.inventory.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;

import java.util.UUID;

@JsonPropertyOrder({ "id", "uuid","name","location" })
public record CreateInventoryResponse(
        Long id,
        UUID uuid,
        String name,
        String location,
        String imgUrl
) {}
