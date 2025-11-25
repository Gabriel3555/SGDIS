package com.sgdis.backend.inventory.application.port.in;

import com.sgdis.backend.inventory.application.dto.InventoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ListInventoryUseCase {
    Page<InventoryResponse> listInventoryes(Pageable pageable);
}
