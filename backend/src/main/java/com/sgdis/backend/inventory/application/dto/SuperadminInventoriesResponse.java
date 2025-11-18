package com.sgdis.backend.inventory.application.dto;

import com.sgdis.backend.data.regional.dto.RegionalResponse;
import com.sgdis.backend.institution.application.dto.InstitutionResponse;

import java.util.List;

public record SuperadminInventoriesResponse(
        RegionalResponse regional,
        List<InstitutionWithInventories> institutions
) {
    public record InstitutionWithInventories(
            InstitutionResponse institution,
            List<InventoryResponse> inventories
    ) {}
}

