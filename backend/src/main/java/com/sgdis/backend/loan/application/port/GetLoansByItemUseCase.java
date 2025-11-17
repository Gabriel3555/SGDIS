package com.sgdis.backend.loan.application.port;

import com.sgdis.backend.loan.application.dto.LoanResponse;

import java.util.List;

public interface GetLoansByItemUseCase {
    List<LoanResponse> getLoansByItemId(Long itemId);
}

