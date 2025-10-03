package com.sgdis.backend.web;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;

@Controller
public class DashboardController {

    @GetMapping("/dashboard/user")
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

    @GetMapping("/dashboard/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseBody
    public ResponseEntity<Resource> adminDashboard() throws IOException {
        Resource resource = new ClassPathResource("static/views/dashboard/admin/dashboard.html");
        if (resource.exists()) {
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(resource);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

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
}