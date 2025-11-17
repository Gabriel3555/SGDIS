package com.sgdis.backend.loan.application.port;

import com.sgdis.backend.loan.application.dto.LendItemRequest;
import com.sgdis.backend.loan.application.dto.LendItemResponse;

public interface LendItemUseCase {
    LendItemResponse lendItem(LendItemRequest request);
}
