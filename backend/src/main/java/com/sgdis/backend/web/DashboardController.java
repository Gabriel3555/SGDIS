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
public class DashboardController {

    @GetMapping("/dashboard/user")
    @PreAuthorize("hasRole('USER')")
    @ResponseBody
    public String userDashboard() {
        // Redirige a la ruta oficial de usuario para evitar rutas duplicadas
        return "redirect:/user/dashboard";
    }


    @GetMapping({"/dashboard/admin_institution", "/dashboard/admininstitution"})
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


    @GetMapping("/dashboard/admin_regional")
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

    @GetMapping("/dashboard/superadmin")
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

}