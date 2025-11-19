package com.sgdis.backend.verification.application.port.in;

import com.sgdis.backend.verification.application.dto.LatestVerificationResponse;

import java.util.List;

public interface GetLatestInventoryVerificationsUseCase {
    List<LatestVerificationResponse> getLatestVerificationsByInventory(Long inventoryId, int limit);
}

