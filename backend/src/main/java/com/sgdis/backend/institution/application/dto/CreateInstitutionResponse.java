package com.sgdis.backend.institution.application.dto;

public record CreateInstitutionResponse(
        Long institutionId,
        String name,
        String codeInstitution,
        Long regionalId,
        Long cityId
) {}
