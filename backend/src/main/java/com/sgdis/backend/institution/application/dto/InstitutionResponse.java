package com.sgdis.backend.institution.application.dto;

public record InstitutionResponse(
        Long id,
        String name,
        Long regionalId,
        Long cityId
) {
}
