package com.sgdis.backend.loan.application.dto;

import java.time.LocalDateTime;

public record LoanResponse(
        Long id,
        Long lenderId,
        String lenderName,
        Long itemId,
        String itemName,
        String licencePlateNumber,
        Long responsibleId,
        String responsibleName,
        String detailsLend,
        String detailsReturn,
        LocalDateTime lendAt,
        LocalDateTime returnAt,
        Boolean returned
) {}

