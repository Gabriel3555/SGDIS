package com.sgdis.backend.institution.application.dto;

public record GetAllInstitutionResponse(
        Long institutionId,
        String name,
        Long regionalId,
        Long cityId
) {}
