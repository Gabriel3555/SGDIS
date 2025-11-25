package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.DeleteItemResponse;

public interface DeleteItemUseCase {
    DeleteItemResponse deleteItem(Long itemId);
}

