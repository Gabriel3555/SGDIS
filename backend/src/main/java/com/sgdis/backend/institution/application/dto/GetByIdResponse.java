package com.sgdis.backend.institution.application.dto;

public record GetByIdResponse(
        Long id,
        String name,
        String codeInstitution,
        Long regionalId,
        Long cityId
) {
}
