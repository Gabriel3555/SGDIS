package com.sgdis.backend.notification.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.notification.dto.NotificationResponse;
import com.sgdis.backend.notification.infrastructure.entity.NotificationEntity;
import com.sgdis.backend.notification.infrastructure.repository.SpringDataNotificationRepository;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPersistenceService {

    private final SpringDataNotificationRepository notificationRepository;
    private final SpringDataUserRepository userRepository;
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    /**
     * Guarda una notificación en la base de datos
     */
    @Transactional
    public NotificationEntity saveNotification(Long userId, String type, String title, String message, Object data) {
        try {
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String dataJson = data != null ? objectMapper.writeValueAsString(data) : null;

            NotificationEntity notification = NotificationEntity.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .dataJson(dataJson)
                    .isRead(false)
                    .build();

            NotificationEntity saved = notificationRepository.save(notification);
            log.info("Notificación guardada para usuario {}: {}", userId, title);
            return saved;
        } catch (Exception e) {
            log.error("Error al guardar notificación: {}", e.getMessage(), e);
            throw new RuntimeException("Error al guardar notificación", e);
        }
    }

    /**
     * Obtiene las notificaciones del usuario actual
     */
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        UserEntity currentUser = authService.getCurrentUser();
        Page<NotificationEntity> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);
        
        return notifications.map(this::toResponse);
    }

    /**
     * Obtiene las notificaciones no leídas del usuario actual
     */
    public List<NotificationResponse> getMyUnreadNotifications() {
        UserEntity currentUser = authService.getCurrentUser();
        List<NotificationEntity> notifications = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(currentUser.getId());
        
        return notifications.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Cuenta las notificaciones no leídas del usuario actual
     */
    public long countMyUnreadNotifications() {
        UserEntity currentUser = authService.getCurrentUser();
        return notificationRepository.countByUserIdAndIsReadFalse(currentUser.getId());
    }

    /**
     * Marca una notificación como leída
     */
    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.markAsRead(notificationId);
        log.info("Notificación {} marcada como leída", notificationId);
    }

    /**
     * Marca todas las notificaciones del usuario como leídas
     */
    @Transactional
    public void markAllAsRead() {
        UserEntity currentUser = authService.getCurrentUser();
        notificationRepository.markAllAsReadForUser(currentUser.getId());
        log.info("Todas las notificaciones del usuario {} marcadas como leídas", currentUser.getId());
    }

    /**
     * Convierte una entidad a DTO de respuesta
     */
    private NotificationResponse toResponse(NotificationEntity entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getDataJson(),
                entity.isRead(),
                entity.getCreatedAt(),
                entity.getReadAt()
        );
    }
}

