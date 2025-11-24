package com.sgdis.backend.institution.application.dto;

public record InstitutionResponseWithoutRegionalResponse(
        Long id,
        String name,
        String codeInstitution,
        Long cityId
) {
}
