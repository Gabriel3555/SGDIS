package com.sgdis.backend.item.application.dto;

import java.util.List;

public record BulkUploadResponse(
        int totalRows,
        int successfulItems,
        int failedItems,
        List<String> errors
) {}

