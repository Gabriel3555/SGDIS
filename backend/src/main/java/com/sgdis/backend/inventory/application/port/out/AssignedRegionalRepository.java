package com.sgdis.backend.inventory.application.port.out;

import com.sgdis.backend.inventory.application.dto.AssignedRegionalRequest;
import com.sgdis.backend.inventory.application.dto.InventoryRegionalDTO;

public interface AssignedRegionalRepository {
    InventoryRegionalDTO assignedRegional(AssignedRegionalRequest request);
}
