package com.sgdis.backend.item.application.dto;

public record DeleteItemResponse(
        Long itemId,
        String itemName,
        String message
) {}

