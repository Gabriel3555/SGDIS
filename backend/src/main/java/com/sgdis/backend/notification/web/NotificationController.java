package com.sgdis.backend.notification.web;

import com.sgdis.backend.notification.dto.NotificationResponse;
import com.sgdis.backend.notification.dto.RegisterDeviceTokenRequest;
import com.sgdis.backend.notification.service.DeviceTokenService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final DeviceTokenService deviceTokenService;
    private final NotificationPersistenceService notificationPersistenceService;

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

    @GetMapping("/my-notifications")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<NotificationResponse>> getMyNotifications(Pageable pageable) {
        try {
            Page<NotificationResponse> notifications = notificationPersistenceService.getMyNotifications(pageable);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error al obtener notificaciones: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/my-notifications/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponse>> getMyUnreadNotifications() {
        try {
            List<NotificationResponse> notifications = notificationPersistenceService.getMyUnreadNotifications();
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            log.error("Error al obtener notificaciones no leídas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/my-notifications/unread/count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        try {
            long count = notificationPersistenceService.countMyUnreadNotifications();
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            log.error("Error al contar notificaciones no leídas: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{notificationId}/mark-as-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long notificationId) {
        try {
            notificationPersistenceService.markAsRead(notificationId);
            return ResponseEntity.ok(Map.of(
                "message", "Notificación marcada como leída",
                "status", "success"
            ));
        } catch (Exception e) {
            log.error("Error al marcar notificación como leída: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Error al marcar notificación como leída",
                "status", "error"
            ));
        }
    }

    @PutMapping("/mark-all-as-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        try {
            notificationPersistenceService.markAllAsRead();
            return ResponseEntity.ok(Map.of(
                "message", "Todas las notificaciones marcadas como leídas",
                "status", "success"
            ));
        } catch (Exception e) {
            log.error("Error al marcar todas como leídas: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Error al marcar todas como leídas",
                "status", "error"
            ));
        }
    }
}

