package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;

import java.util.List;

public interface GetManagedInventoriesUseCase {
    List<ManagedInventoryResponse> getManagedInventories(Long userId);
}