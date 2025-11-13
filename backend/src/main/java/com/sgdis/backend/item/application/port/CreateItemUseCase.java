package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.CreateItemRequest;
import com.sgdis.backend.item.application.dto.CreateItemResponse;

public interface CreateItemUseCase {
    CreateItemResponse createItem(CreateItemRequest request);
}