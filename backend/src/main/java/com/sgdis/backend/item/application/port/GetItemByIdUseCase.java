package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.ItemDTO;

public interface GetItemByIdUseCase {
    ItemDTO getItemById(Long itemId);
}

