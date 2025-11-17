package com.sgdis.backend.loan.application.dto;

public record LendItemRequest(
        Long itemId,
        String responsibleName,
        String details
) {}