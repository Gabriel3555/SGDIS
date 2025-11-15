package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.GetAllSignatoriesRequest;
import com.sgdis.backend.inventory.application.dto.GetAllSignatoriesResponse;

public interface GetAllSignatoriesUseCase {
    GetAllSignatoriesResponse getAllSignatories(GetAllSignatoriesRequest request);
}
