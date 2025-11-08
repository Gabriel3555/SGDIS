package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.AssignRegionalRequest;
import com.sgdis.backend.user.application.dto.AssignRegionalResponse;

public interface AssignRegionalUseCase {
    AssignRegionalResponse assignRegional(AssignRegionalRequest request);
}
