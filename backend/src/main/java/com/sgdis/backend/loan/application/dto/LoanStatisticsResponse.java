package com.sgdis.backend.loan.application.dto;

public record LoanStatisticsResponse(
        Long totalLoans,
        Long activeLoans,
        Long returnedLoans
) {}

