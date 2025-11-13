package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.UpdateItemRequest;
import com.sgdis.backend.item.application.dto.UpdateItemResponse;

public interface UpdateItemUseCase {
    UpdateItemResponse updateItem(UpdateItemRequest request);
}