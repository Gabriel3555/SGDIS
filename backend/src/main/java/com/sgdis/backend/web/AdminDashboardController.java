package com.sgdis.backend.web;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.util.Collection;

@Hidden
@Controller
public class AdminDashboardController {

    @GetMapping({"/admin_institution/dashboard", "/admininstitution/dashboard"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/admin-institution/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/users", "/admininstitution/users"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> usersManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/users/users-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/inventory", "/admininstitution/inventory"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> inventoryManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/inventory/inventory-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/dashboard")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/admin-regional/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/users")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalUsersManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/users/users-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/inventory")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalInventoryManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/inventory/inventory-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/dashboard")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/superadmin/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/users")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminUsersManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/users/users.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/import-export")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminImportExport() throws IOException {
        Resource resource = new ClassPathResource("static/views/import-export/import-export.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/inventory")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminInventoryManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/inventory/inventory-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/info-me")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userProfile() throws IOException {
        // Only for USER role
        Resource resource = new ClassPathResource("static/views/info-me/info-me.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/info-me")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalInfoMe() throws IOException {
        Resource resource = new ClassPathResource("static/views/info-me/info-me-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/info-me", "/admininstitution/info-me"})
    @PreAuthorize("hasAuthority('ADMIN_INSTITUTION') or hasAuthority('ROLE_ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionInfoMe() throws IOException {
        Resource resource = new ClassPathResource("static/views/info-me/info-me-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/info-me")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminInfoMe() throws IOException {
        Resource resource = new ClassPathResource("static/views/info-me/info-me-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/info-me")
    @PreAuthorize("hasAuthority('WAREHOUSE') or hasAuthority('ROLE_WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseInfoMe() throws IOException {
        Resource resource = new ClassPathResource("static/views/info-me/info-me-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/items")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminItemsManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/items/items.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/items")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalItemsManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/items/items.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/items", "/admininstitution/items"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionItemsManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/items/items.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/verification")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminVerificationManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/verification/verification-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/loans")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminLoansManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/loans/loans-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/transfers")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminTransfers() throws IOException {
        Resource resource = new ClassPathResource("static/views/transfers/transfers-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/reports")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminReports() throws IOException {
        Resource resource = new ClassPathResource("static/views/reports/reports.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/notifications")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminNotifications() throws IOException {
        Resource resource = new ClassPathResource("static/views/notifications/notifications-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/verification")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalVerificationManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/verification/verification-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/verification", "/admininstitution/verification"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionVerificationManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/verification/verification-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/transfers", "/admininstitution/transfers"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionTransfers() throws IOException {
        Resource resource = new ClassPathResource("static/views/transfers/transfers-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/loans", "/admininstitution/loans"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionLoans() throws IOException {
        Resource resource = new ClassPathResource("static/views/loans/loans-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/auditory", "/admininstitution/auditory"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionAuditory() throws IOException {
        Resource resource = new ClassPathResource("static/views/auditory/auditory-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/notifications", "/admininstitution/notifications"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionNotifications() throws IOException {
        Resource resource = new ClassPathResource("static/views/notifications/notifications-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/import-export", "/admininstitution/import-export"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionImportExport() throws IOException {
        Resource resource = new ClassPathResource("static/views/import-export/imports-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/settings")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminConfiguration() throws IOException {
        Resource resource = new ClassPathResource("static/views/configuration/configuration.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/auditory")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminAuditory() throws IOException {
        Resource resource = new ClassPathResource("static/views/auditory/auditory.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/cancellations")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminCancellations() throws IOException {
        Resource resource = new ClassPathResource("static/views/cancellations/cancellations-superadmin.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/cancellations", "/admininstitution/cancellations"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionCancellations() throws IOException {
        Resource resource = new ClassPathResource("static/views/cancellations/cancellations-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/cancellations")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalCancellations() throws IOException {
        Resource resource = new ClassPathResource("static/views/cancellations/cancellations-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/settings")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalConfiguration() throws IOException {
        Resource resource = new ClassPathResource("static/views/configuration/configuration-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/centers")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalCenters() throws IOException {
        Resource resource = new ClassPathResource("static/views/centers/centers-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/transfers")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalTransfers() throws IOException {
        Resource resource = new ClassPathResource("static/views/transfers/transfers-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/loans")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalLoans() throws IOException {
        Resource resource = new ClassPathResource("static/views/loans/loans-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/reports")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalReports() throws IOException {
        Resource resource = new ClassPathResource("static/views/reports/reports-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/auditory")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalAuditory() throws IOException {
        Resource resource = new ClassPathResource("static/views/auditory/auditory-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/notifications")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalNotifications() throws IOException {
        Resource resource = new ClassPathResource("static/views/notifications/notifications-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/admin_regional/import-export")
    @PreAuthorize("hasRole('ADMIN_REGIONAL')")
    @ResponseBody
    public ResponseEntity<Resource> adminRegionalImportExport() throws IOException {
        Resource resource = new ClassPathResource("static/views/import-export/import-export-admin-regional.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/settings", "/admininstitution/settings"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionConfiguration() throws IOException {
        Resource resource = new ClassPathResource("static/views/configuration/configuration-admin-institution.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping({"/admin_institution/reports", "/admininstitution/reports"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminInstitutionReports() throws IOException {
        Resource resource = new ClassPathResource("static/views/reports/admin-institution-reports.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/reports")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseReports() throws IOException {
        Resource resource = new ClassPathResource("static/views/reports/warehouse-reports.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/settings")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseConfiguration() throws IOException {
        Resource resource = new ClassPathResource("static/views/configuration/configuration.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/loans")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseLoans() throws IOException {
        Resource resource = new ClassPathResource("static/views/loans/loans-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/transfers")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseTransfers() throws IOException {
        Resource resource = new ClassPathResource("static/views/transfers/transfers-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/users")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseUsers() throws IOException {
        Resource resource = new ClassPathResource("static/views/users/users-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/auditory")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseAuditory() throws IOException {
        Resource resource = new ClassPathResource("static/views/auditory/auditory-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/settings")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userConfiguration() throws IOException {
        Resource resource = new ClassPathResource("static/views/configuration/configuration.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION', 'WAREHOUSE', 'USER')")
    @ResponseBody
    public ResponseEntity<Resource> configuration() throws IOException {
        Resource resource = new ClassPathResource("static/views/configuration/configuration.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/centers")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminCenters() throws IOException {
        Resource resource = new ClassPathResource("static/views/centers/centers.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/superadmin/centers/map")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> superadminCentersMap() throws IOException {
        Resource resource = new ClassPathResource("static/views/centers/centers-map-pro.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // User routes
    @GetMapping("/user/dashboard")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/user/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/my-inventories")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userMyInventories() throws IOException {
        Resource resource = new ClassPathResource("static/views/inventory/user-my-inventories.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/inventory/{inventoryId}")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userInventoryItems(@PathVariable Long inventoryId) throws IOException {
        Resource resource = new ClassPathResource("static/views/inventory/user-inventory-items.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/notifications")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userNotifications() throws IOException {
        Resource resource = new ClassPathResource("static/views/notifications/notifications.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/notifications")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseNotifications() throws IOException {
        Resource resource = new ClassPathResource("static/views/notifications/notifications-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/loans")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userLoans() throws IOException {
        Resource resource = new ClassPathResource("static/views/loans/loans-user.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/verification")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userVerification() throws IOException {
        Resource resource = new ClassPathResource("static/views/verification/verification.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/verification")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseVerification() throws IOException {
        Resource resource = new ClassPathResource("static/views/verification/verification-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/cancellations")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseCancellations() throws IOException {
        Resource resource = new ClassPathResource("static/views/cancellations/cancellations-warehouse.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/user/transfers")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public ResponseEntity<Resource> userTransfers() throws IOException {
        Resource resource = new ClassPathResource("static/views/transfers/transfers-user.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
