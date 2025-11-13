package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.ItemDTO;
import org.springframework.data.domain.Page;

public interface GetItemsByInventoryUseCase {
    Page<ItemDTO> getItemsByInventory(Long inventoryId, int page, int size);
}