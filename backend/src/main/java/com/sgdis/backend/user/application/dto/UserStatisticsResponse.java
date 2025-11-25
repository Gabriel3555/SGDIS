package com.sgdis.backend.user.application.dto;

import lombok.Builder;

@Builder
public record UserStatisticsResponse(
        Long totalUsers,
        Long superadminCount,
        Long adminInstitutionCount,
        Long adminRegionalCount,
        Long warehouseCount,
        Long userCount
) {}

