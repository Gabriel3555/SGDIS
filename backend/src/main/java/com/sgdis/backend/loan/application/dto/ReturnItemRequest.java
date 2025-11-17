package com.sgdis.backend.loan.application.dto;

public record ReturnItemRequest(
    Long loanId,
    String detailsReturn
) {}