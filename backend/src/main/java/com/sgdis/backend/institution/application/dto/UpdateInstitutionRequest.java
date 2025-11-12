package com.sgdis.backend.institution.application.dto;

public record UpdateInstitutionRequest(
        String name,
        Long regionalId,
        Long cityId
) {}
