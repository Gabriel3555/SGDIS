package com.sgdis.backend.institution.application.dto;

public record CreateInstitutionRequest(
        String name,
        Long regionalId,
        Long cityId
)
{}
