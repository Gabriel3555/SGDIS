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
public class WarehouseDashboardController {

    @GetMapping("/dashboard/warehouse")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/warehouse/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/dashboard")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseDashboardAlt() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/warehouse/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/inventory")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseInventoryManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/warehouse/inventory.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/items")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseItemsManagement() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/warehouse/items.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/warehouse/import-export")
    @PreAuthorize("hasRole('WAREHOUSE')")
    @ResponseBody
    public ResponseEntity<Resource> warehouseImportExport() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/warehouse/import-export.html");
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
        Resource resource = new ClassPathResource("static/views/dashboard/warehouse/warehouse-loans.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}