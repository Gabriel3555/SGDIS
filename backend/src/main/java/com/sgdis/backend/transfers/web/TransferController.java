package com.sgdis.backend.transfers.web;

import com.sgdis.backend.transfers.application.dto.ApproveTransferRequest;
import com.sgdis.backend.transfers.application.dto.ApproveTransferResponse;
import com.sgdis.backend.transfers.application.dto.RequestTransferRequest;
import com.sgdis.backend.transfers.application.dto.RequestTransferResponse;
import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;
import com.sgdis.backend.transfers.application.port.in.ApproveTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.RequestTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.GetInventoryTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetItemTransfersUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transfers")
@Tag(name = "Transfers", description = "Operations related to item transfers")
public class TransferController {

    private final ApproveTransferUseCase approveTransferUseCase;
    private final RequestTransferUseCase requestTransferUseCase;
    private final GetInventoryTransfersUseCase getInventoryTransfersUseCase;
    private final GetItemTransfersUseCase getItemTransfersUseCase;

    @Operation(
            summary = "Retrieves transfers related to an inventory",
            description = "Returns the transfers where the inventory is either source or destination"
    )
    @ApiResponse(responseCode = "200", description = "Transfers retrieved successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Inventory not found")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/inventory/{inventoryId}")
    public ResponseEntity<List<TransferSummaryResponse>> getInventoryTransfers(
            @PathVariable Long inventoryId
    ) {
        List<TransferSummaryResponse> transfers = getInventoryTransfersUseCase.getTransfersByInventory(inventoryId);
        return ResponseEntity.ok(transfers);
    }

    @Operation(
            summary = "Retrieves transfers for a specific item",
            description = "Returns all transfers associated with a specific item"
    )
    @ApiResponse(responseCode = "200", description = "Transfers retrieved successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Item not found")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<TransferSummaryResponse>> getItemTransfers(
            @PathVariable Long itemId
    ) {
        List<TransferSummaryResponse> transfers = getItemTransfersUseCase.getTransfersByItemId(itemId);
        return ResponseEntity.ok(transfers);
    }

    @Operation(
            summary = "Requests the transfer of an item",
            description = "Creates a request to move an item to another inventory",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(schema = @Schema(implementation = RequestTransferRequest.class))
            )
    )
    @ApiResponse(responseCode = "201", description = "Transfer requested successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Item or inventory not found")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/request")
    public ResponseEntity<RequestTransferResponse> requestTransfer(
            @Valid @RequestBody RequestTransferRequest request
    ) {
        RequestTransferResponse response = requestTransferUseCase.requestTransfer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Approves an item transfer",
            description = "Confirms the transfer of an item to the destination inventory",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = false,
                    content = @Content(schema = @Schema(implementation = ApproveTransferRequest.class))
            )
    )
    @ApiResponse(responseCode = "200", description = "Transfer approved successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Transfer not found")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{transferId}/approve")
    public ResponseEntity<ApproveTransferResponse> approveTransfer(
            @PathVariable Long transferId,
            @Valid @RequestBody(required = false) ApproveTransferRequest request
    ) {
        ApproveTransferResponse response = approveTransferUseCase.approveTransfer(transferId, request);
        return ResponseEntity.ok(response);
    }
}

