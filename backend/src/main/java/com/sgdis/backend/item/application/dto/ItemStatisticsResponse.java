package com.sgdis.backend.item.application.dto;

public record ItemStatisticsResponse(
        Long totalItems,
        Long activeItems,
        Long inactiveItems
) {
}

