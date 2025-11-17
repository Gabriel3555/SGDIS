package com.sgdis.backend.loan.web;

import com.sgdis.backend.loan.application.dto.LendItemRequest;
import com.sgdis.backend.loan.application.dto.LendItemResponse;
import com.sgdis.backend.loan.application.dto.LoanResponse;
import com.sgdis.backend.loan.application.dto.ReturnItemRequest;
import com.sgdis.backend.loan.application.dto.ReturnItemResponse;
import com.sgdis.backend.loan.application.port.GetLastLoanByItemUseCase;
import com.sgdis.backend.loan.application.port.GetLoansByItemUseCase;
import com.sgdis.backend.loan.application.port.LendItemUseCase;
import com.sgdis.backend.loan.application.port.ReturnItemUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/loan")
@Tag(name = "Loan Management", description = "Operations related to loan management")
public class LoanController {

    private final LendItemUseCase lendItemUseCase;
    private final ReturnItemUseCase returnItemUseCase;
    private final GetLoansByItemUseCase getLoansByItemUseCase;
    private final GetLastLoanByItemUseCase getLastLoanByItemUseCase;

    @PostMapping("/lend")
    @Operation(
            summary = "Lend an item",
            description = "Create a new loan record for an item to a responsible person"
    )
    @ApiResponse(
            responseCode = "201",
            description = "Item lent successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or item cannot be lent")
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<LendItemResponse> lendItem(@RequestBody LendItemRequest request) {
        LendItemResponse response = lendItemUseCase.lendItem(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/return")
    @Operation(
            summary = "Return an item",
            description = "Mark a loan as returned"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Item returned successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or item cannot be returned")
    @ApiResponse(responseCode = "404", description = "Loan not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<ReturnItemResponse> returnItem(@RequestBody ReturnItemRequest request) {
        ReturnItemResponse response = returnItemUseCase.returnItem(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/item/{itemId}")
    @Operation(
            summary = "List all loans for an item",
            description = "Retrieves all loan records for a specific item, ordered by most recent first"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Loans retrieved successfully"
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<List<LoanResponse>> getLoansByItemId(@PathVariable Long itemId) {
        List<LoanResponse> loans = getLoansByItemUseCase.getLoansByItemId(itemId);
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/item/{itemId}/last")
    @Operation(
            summary = "Get last loan for an item",
            description = "Retrieves the most recent loan record for a specific item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Last loan retrieved successfully"
    )
    @ApiResponse(responseCode = "404", description = "Item not found or no loans exist")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<LoanResponse> getLastLoanByItemId(@PathVariable Long itemId) {
        Optional<LoanResponse> lastLoan = getLastLoanByItemUseCase.getLastLoanByItemId(itemId);
        return lastLoan.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

}
