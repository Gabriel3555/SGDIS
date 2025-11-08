package com.sgdis.backend.user.application.dto;

public record AssignRegionalRequest(
        Long regionalId,
        Long userId
) {}
