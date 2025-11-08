package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.user.application.dto.AssignRegionalRequest;
import com.sgdis.backend.user.application.dto.AssignRegionalResponse;

public interface AssignedRegionalUseCase {
    AssignRegionalResponse assignRegional (AssignRegionalRequest assignRegionalRequest);
}
