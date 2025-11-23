package com.sgdis.backend.cancellation.application.dto;

import com.sgdis.backend.item.application.dto.ItemDTO;

import java.time.LocalDateTime;
import java.util.List;

public record AskForCancellationResponse(
        Long id,
        String message
) {}
