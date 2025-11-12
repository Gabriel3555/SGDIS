package com.sgdis.backend.institution.application.dto;

public record UpdateInstitutionResponse(
        Long id,
        String name,
        Long regionalId,
        Long cityId
) {}
