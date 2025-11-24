package com.sgdis.backend.institution.application.dto;

public record UpdateInstitutionRequest(
        String name,
        String codeInstitution,
        Long regionalId,
        Long cityId
) {}
