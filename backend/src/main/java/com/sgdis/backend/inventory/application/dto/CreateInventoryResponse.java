package com.sgdis.backend.inventory.application.dto;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.sgdis.backend.user.application.dto.UserResponse;

import java.util.UUID;

@JsonPropertyOrder({ "id", "uuid","name","location","imgUrl","owner" })
public record CreateInventoryResponse(
        Long id,
        UUID uuid,
        String name,
        String location,
        String imgUrl,
        UserResponse owner
) {}
