package com.sgdis.backend.loan.application.port;

import com.sgdis.backend.loan.application.dto.ReturnItemRequest;
import com.sgdis.backend.loan.application.dto.ReturnItemResponse;

public interface ReturnItemUseCase {
    ReturnItemResponse returnItem(ReturnItemRequest request);
}