package com.sgdis.backend.inventory.application.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateInventoryInstitutionRequest(
        @NotNull Long institutionId
) {
}






