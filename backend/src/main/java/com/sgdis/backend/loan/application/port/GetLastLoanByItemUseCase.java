package com.sgdis.backend.loan.application.port;

import com.sgdis.backend.loan.application.dto.LoanResponse;

import java.util.Optional;

public interface GetLastLoanByItemUseCase {
    Optional<LoanResponse> getLastLoanByItemId(Long itemId);
}

