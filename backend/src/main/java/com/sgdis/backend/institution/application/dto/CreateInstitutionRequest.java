package com.sgdis.backend.institution.application.dto;

public record CreateInstitutionRequest(
        String name,
        String codeInstitution,
        Long regionalId,
        Long cityId
)
{}
