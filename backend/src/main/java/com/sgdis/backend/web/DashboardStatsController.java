package com.sgdis.backend.web;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.web.dto.AdminRegionalDashboardStatsResponse;
import com.sgdis.backend.web.dto.SuperadminDashboardStatsResponse;
import com.sgdis.backend.web.service.AdminRegionalDashboardStatsService;
import com.sgdis.backend.web.service.SuperadminDashboardStatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard statistics endpoints")
@SecurityRequirement(name = "bearerAuth")
public class DashboardStatsController {

    private final SuperadminDashboardStatsService dashboardStatsService;
    private final AdminRegionalDashboardStatsService adminRegionalDashboardStatsService;
    private final AuthService authService;

    @Operation(
            summary = "Get superadmin dashboard statistics",
            description = "Retrieves all consolidated statistics for the superadmin dashboard. Can be filtered by regionalId and/or institutionId."
    )
    @GetMapping("/superadmin/stats")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ResponseEntity<SuperadminDashboardStatsResponse> getSuperadminDashboardStats(
            @Parameter(description = "Optional regional ID to filter statistics")
            @RequestParam(required = false) Long regionalId,
            @Parameter(description = "Optional institution ID to filter statistics")
            @RequestParam(required = false) Long institutionId
    ) {
        SuperadminDashboardStatsResponse stats = dashboardStatsService.getDashboardStats(regionalId, institutionId);
        return ResponseEntity.ok(stats);
    }

    @Operation(
            summary = "Get admin regional dashboard statistics",
            description = "Retrieves all consolidated statistics for the admin regional dashboard. Statistics are automatically filtered by the user's regional."
    )
    @GetMapping("/admin-regional/stats")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    public ResponseEntity<AdminRegionalDashboardStatsResponse> getAdminRegionalDashboardStats() {
        // Get the current user
        UserEntity currentUser = authService.getCurrentUser();
        
        // Get the user's institution and regional ID
        if (currentUser.getInstitution() == null || currentUser.getInstitution().getRegional() == null) {
            throw new IllegalStateException("El usuario no tiene una institución o regional asignada");
        }
        
        Long regionalId = currentUser.getInstitution().getRegional().getId();
        AdminRegionalDashboardStatsResponse stats = adminRegionalDashboardStatsService.getDashboardStats(regionalId);
        return ResponseEntity.ok(stats);
    }
}

