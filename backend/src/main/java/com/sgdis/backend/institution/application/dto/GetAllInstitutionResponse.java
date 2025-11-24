package com.sgdis.backend.institution.application.dto;

public record GetAllInstitutionResponse(
        Long institutionId,
        String name,
        String codeInstitution,
        Long regionalId,
        Long cityId
) {}
