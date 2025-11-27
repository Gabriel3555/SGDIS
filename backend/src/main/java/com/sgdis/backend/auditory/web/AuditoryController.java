package com.sgdis.backend.auditory.web;

import com.sgdis.backend.auditory.application.dto.PagedAuditoryResponse;
import com.sgdis.backend.auditory.application.port.in.ListAuditoryUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auditories")
@RequiredArgsConstructor
@Tag(name = "Auditories", description = "Auditory records endpoints")
@SecurityRequirement(name = "bearerAuth")
public class AuditoryController {

    private final ListAuditoryUseCase listAuditoryUseCase;

    @Operation(
            summary = "List all auditory records",
            description = "Retrieves all auditory records with pagination and optional filters (Superadmin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Auditory records retrieved successfully",
            content = @Content(schema = @Schema(implementation = PagedAuditoryResponse.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping
    public PagedAuditoryResponse listAuditories(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Filter by regional ID") @RequestParam(required = false) Long regionalId,
            @Parameter(description = "Filter by institution ID") @RequestParam(required = false) Long institutionId,
            @Parameter(description = "Filter by performer (user) ID") @RequestParam(required = false) Long performerId) {
        Pageable pageable = PageRequest.of(page, size);
        com.sgdis.backend.auditory.application.service.AuditoryService auditoryService = 
            (com.sgdis.backend.auditory.application.service.AuditoryService) listAuditoryUseCase;
        
        // If any filter is provided, use filtered method
        if (regionalId != null || institutionId != null || performerId != null) {
            return auditoryService.listAuditoriesWithFilters(regionalId, institutionId, performerId, pageable);
        }
        
        return listAuditoryUseCase.listAuditories(pageable);
    }

    @Operation(
            summary = "List auditory records by regional",
            description = "Retrieves all auditory records for a specific regional with pagination"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Auditory records retrieved successfully",
            content = @Content(schema = @Schema(implementation = PagedAuditoryResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "404", description = "Regional not found")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @GetMapping("/regional/{regionalId}")
    public PagedAuditoryResponse listAuditoriesByRegional(
            @Parameter(description = "Regional ID", required = true)
            @org.springframework.web.bind.annotation.PathVariable Long regionalId,
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ((com.sgdis.backend.auditory.application.service.AuditoryService) listAuditoryUseCase)
                .listAuditoriesByRegional(regionalId, pageable);
    }

    @Operation(
            summary = "List auditory records by institution",
            description = "Retrieves all auditory records for the current user's institution with pagination (Admin Institution only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Auditory records retrieved successfully",
            content = @Content(schema = @Schema(implementation = PagedAuditoryResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "404", description = "Institution not found")
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @GetMapping("/institution")
    public PagedAuditoryResponse listAuditoriesByInstitution(
            @Parameter(description = "Page number (0-indexed)", required = false)
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false)
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        com.sgdis.backend.auditory.application.service.AuditoryService auditoryService = 
            (com.sgdis.backend.auditory.application.service.AuditoryService) listAuditoryUseCase;
        return auditoryService.listAuditoriesByInstitution(pageable);
    }
}

