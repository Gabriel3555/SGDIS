package com.sgdis.backend.item.application.port;

import com.sgdis.backend.item.application.dto.ItemDTO;
import org.springframework.data.domain.Page;

public interface GetItemsByInventoryAndCategoryUseCase {
    Page<ItemDTO> getItemsByInventoryAndCategory(Long inventoryId, Long categoryId, int page, int size);
}