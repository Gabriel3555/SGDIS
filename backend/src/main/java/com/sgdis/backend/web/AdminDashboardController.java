package com.sgdis.backend.web;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;

@Hidden
@Controller
public class AdminDashboardController {

    @GetMapping({"/admin_institution/dashboard", "/admininstitution/dashboard"})
    @PreAuthorize("hasRole('ADMIN_INSTITUTION')")
    @ResponseBody
    public ResponseEntity<Resource> adminDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/superadmin/dashboard.html");
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
        Resource resource = new ClassPathResource("static/views/users/users.html");
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
        Resource resource = new ClassPathResource("static/views/inventory/inventory.html");
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
        Resource resource = new ClassPathResource("static/views/inventory/inventory.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/info-me")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION', 'WAREHOUSE', 'USER')")
    @ResponseBody
    public ResponseEntity<Resource> userProfile() throws IOException {
        Resource resource = new ClassPathResource("static/views/info-me/info-me.html");
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
        Resource resource = new ClassPathResource("static/views/verification/verification.html");
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
        Resource resource = new ClassPathResource("static/views/loans/loans.html");
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
        Resource resource = new ClassPathResource("static/views/transfers/transfers.html");
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
        Resource resource = new ClassPathResource("static/views/notifications/notifications.html");
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
        Resource resource = new ClassPathResource("static/views/verification/verification.html");
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
        Resource resource = new ClassPathResource("static/views/configuration/configuration.html");
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
}
