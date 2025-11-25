package com.sgdis.backend.loan.application.dto;

public record LendItemRequest(
        Long itemId,
        Long responsibleId,
        String details
) {}