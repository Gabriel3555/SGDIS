package com.sgdis.backend.notification.web;

import com.sgdis.backend.notification.dto.RegisterDeviceTokenRequest;
import com.sgdis.backend.notification.service.DeviceTokenService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final DeviceTokenService deviceTokenService;

    @PostMapping("/register-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> registerDeviceToken(
            @Valid @RequestBody RegisterDeviceTokenRequest request) {
        try {
            deviceTokenService.registerDeviceToken(request);
            return ResponseEntity.ok(Map.of(
                "message", "Token registrado exitosamente",
                "status", "success"
            ));
        } catch (Exception e) {
            log.error("Error al registrar token: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Error al registrar token",
                "status", "error"
            ));
        }
    }

    @DeleteMapping("/deactivate-token")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> deactivateToken(@RequestParam String token) {
        try {
            deviceTokenService.deactivateDeviceToken(token);
            return ResponseEntity.ok(Map.of(
                "message", "Token desactivado exitosamente",
                "status", "success"
            ));
        } catch (Exception e) {
            log.error("Error al desactivar token: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Error al desactivar token",
                "status", "error"
            ));
        }
    }
}

