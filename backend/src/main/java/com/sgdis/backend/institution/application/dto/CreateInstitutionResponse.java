package com.sgdis.backend.institution.application.dto;

public record CreateInstitutionResponse(
        Long institutionId,
        String name,
        Long regionalId,
        Long cityId
) {}
