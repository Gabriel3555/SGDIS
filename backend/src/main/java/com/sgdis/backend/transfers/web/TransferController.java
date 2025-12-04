package com.sgdis.backend.transfers.web;

import com.sgdis.backend.transfers.application.dto.ApproveTransferRequest;
import com.sgdis.backend.transfers.application.dto.ApproveTransferResponse;
import com.sgdis.backend.transfers.application.dto.RejectTransferRequest;
import com.sgdis.backend.transfers.application.dto.RejectTransferResponse;
import com.sgdis.backend.transfers.application.dto.RequestTransferRequest;
import com.sgdis.backend.transfers.application.dto.RequestTransferResponse;
import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;
import com.sgdis.backend.transfers.application.port.in.ApproveTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.RejectTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.RequestTransferUseCase;
import com.sgdis.backend.transfers.application.port.in.GetInventoryTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetItemTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetAllTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetRegionalTransfersUseCase;
import com.sgdis.backend.transfers.application.port.in.GetTransferStatisticsUseCase;
import com.sgdis.backend.transfers.application.dto.TransferStatisticsResponse;
import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.transfers.domain.TransferStatus;
import com.sgdis.backend.transfers.infrastructure.repository.SpringDataTransferRepository;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.transfers.mapper.TransferMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/transfers")
@Tag(name = "Transfers", description = "Operations related to item transfers")
public class TransferController {

    private final ApproveTransferUseCase approveTransferUseCase;
    private final RejectTransferUseCase rejectTransferUseCase;
    private final RequestTransferUseCase requestTransferUseCase;
    private final GetInventoryTransfersUseCase getInventoryTransfersUseCase;
    private final GetItemTransfersUseCase getItemTransfersUseCase;
    private final GetAllTransfersUseCase getAllTransfersUseCase;
    private final GetRegionalTransfersUseCase getRegionalTransfersUseCase;
    private final GetTransferStatisticsUseCase getTransferStatisticsUseCase;
    private final AuthService authService;
    private final SpringDataTransferRepository transferRepository;

    @Operation(
            summary = "Get all transfers",
            description = "Retrieves all transfers with pagination (6 transfers per page, ordered by requested date descending)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Transfers retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping
    public ResponseEntity<Page<TransferSummaryResponse>> getAllTransfers(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "6") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        Page<TransferSummaryResponse> transfers = getAllTransfersUseCase.getAllTransfers(pageable);
        return ResponseEntity.ok(transfers);
    }

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

    @Operation(
            summary = "Rejects an item transfer",
            description = "Rejects a transfer request, preventing the item from being moved",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = false,
                    content = @Content(schema = @Schema(implementation = RejectTransferRequest.class))
            )
    )
    @ApiResponse(responseCode = "200", description = "Transfer rejected successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Transfer not found")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{transferId}/reject")
    public ResponseEntity<RejectTransferResponse> rejectTransfer(
            @PathVariable Long transferId,
            @Valid @RequestBody(required = false) RejectTransferRequest request
    ) {
        RejectTransferResponse response = rejectTransferUseCase.rejectTransfer(transferId, request);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Get transfers by regional",
            description = "Retrieves all transfers from inventories belonging to institutions in the specified regional with pagination"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Transfers retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "404", description = "Regional not found")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/regional/{regionalId}")
    public ResponseEntity<Page<TransferSummaryResponse>> getTransfersByRegional(
            @Parameter(description = "Regional ID", required = true)
            @PathVariable Long regionalId,
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "6") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        Page<TransferSummaryResponse> transfers = getRegionalTransfersUseCase.getTransfersByRegional(regionalId, pageable);
        return ResponseEntity.ok(transfers);
    }

    @Operation(
            summary = "Get transfer statistics",
            description = "Retrieves statistics about transfers (total, pending, approved, rejected)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = TransferStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/statistics")
    public ResponseEntity<TransferStatisticsResponse> getTransferStatistics() {
        TransferStatisticsResponse statistics = getTransferStatisticsUseCase.getTransferStatistics();
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "Get regional transfer statistics",
            description = "Retrieves total statistics of transfers in the current user's regional by status. " +
                    "The regional is obtained from the current user's institution."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = TransferStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution or regional not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @GetMapping("/regional/statistics")
    public ResponseEntity<TransferStatisticsResponse> getRegionalTransferStatistics() {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null || currentUser.getInstitution().getRegional() == null) {
            throw new ResourceNotFoundException("User institution or regional not found");
        }
        Long regionalId = currentUser.getInstitution().getRegional().getId();
        
        Long total = transferRepository.countByRegionalId(regionalId);
        Long pending = transferRepository.countByRegionalIdAndStatus(regionalId, TransferStatus.PENDING);
        Long approved = transferRepository.countByRegionalIdAndStatus(regionalId, TransferStatus.APPROVED);
        Long rejected = transferRepository.countByRegionalIdAndStatus(regionalId, TransferStatus.REJECTED);
        
        TransferStatisticsResponse statistics = new TransferStatisticsResponse(total, pending, approved, rejected);
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "Get institution transfer statistics",
            description = "Retrieves total statistics of transfers in the current user's institution by status. " +
                    "The institution is obtained from the current user."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = TransferStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @GetMapping("/institution/statistics")
    public ResponseEntity<TransferStatisticsResponse> getInstitutionTransferStatistics() {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("User institution not found");
        }
        Long institutionId = currentUser.getInstitution().getId();
        
        Long total = transferRepository.countByInstitutionId(institutionId);
        Long pending = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.PENDING);
        Long approved = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.APPROVED);
        Long rejected = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.REJECTED);
        
        TransferStatisticsResponse statistics = new TransferStatisticsResponse(total, pending, approved, rejected);
        return ResponseEntity.ok(statistics);
    }

    @Operation(
            summary = "Get recent transfers for institution",
            description = "Retrieves recent transfers for the current user's institution with pagination. " +
                    "The institution is obtained from the current user."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Recent transfers retrieved successfully",
            content = @Content(schema = @Schema(implementation = Page.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @GetMapping("/institution/recent")
    public ResponseEntity<Page<TransferSummaryResponse>> getInstitutionRecentTransfers(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "5") int size
    ) {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("User institution not found");
        }
        Long institutionId = currentUser.getInstitution().getId();
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "requestedAt"));
        Page<TransferEntity> transferPage = transferRepository.findAllByInstitutionId(institutionId, pageable);
        
        List<TransferSummaryResponse> content = transferPage.getContent().stream()
                .map(TransferMapper::toSummaryResponse)
                .collect(java.util.stream.Collectors.toList());
        
        Page<TransferSummaryResponse> response = new org.springframework.data.domain.PageImpl<>(
                content,
                pageable,
                transferPage.getTotalElements()
        );
        
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Get warehouse transfer statistics",
            description = "Retrieves total statistics of transfers in the current warehouse user's institution by status. " +
                    "The institution is obtained from the current user."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = TransferStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User institution not found")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @GetMapping("/warehouse/statistics")
    public ResponseEntity<TransferStatisticsResponse> getWarehouseTransferStatistics() {
        var currentUser = authService.getCurrentUser();
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("User institution not found");
        }
        Long institutionId = currentUser.getInstitution().getId();
        
        Long total = transferRepository.countByInstitutionId(institutionId);
        Long pending = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.PENDING);
        Long approved = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.APPROVED);
        Long rejected = transferRepository.countByInstitutionIdAndStatus(institutionId, TransferStatus.REJECTED);
        
        TransferStatisticsResponse statistics = new TransferStatisticsResponse(total, pending, approved, rejected);
        return ResponseEntity.ok(statistics);
    }
}

