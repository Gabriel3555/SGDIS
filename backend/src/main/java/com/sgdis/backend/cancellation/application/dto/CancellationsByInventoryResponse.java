package com.sgdis.backend.cancellation.application.dto;

import java.util.Map;

public record CancellationsByInventoryResponse(
        Map<String, Long> cancellationsByInventory
) {}


