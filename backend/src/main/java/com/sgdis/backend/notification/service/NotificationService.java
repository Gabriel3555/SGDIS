package com.sgdis.backend.notification.service;

import com.sgdis.backend.notification.dto.NotificationMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationPersistenceService notificationPersistenceService;

    /**
     * Envía una notificación a un usuario específico
     * 
     * @param userId ID del usuario destinatario
     * @param notification Mensaje de notificación
     */
    public void sendNotificationToUser(Long userId, NotificationMessage notification) {
        try {
            String destination = "/queue/notifications";
            messagingTemplate.convertAndSendToUser(
                    userId.toString(),
                    destination,
                    notification
            );
            log.info("Notificación enviada al usuario {} - Tipo: {}, Título: {}", 
                    userId, notification.type(), notification.title());
        } catch (Exception e) {
            log.error("Error al enviar notificación al usuario {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Envía una notificación de inventario creado al dueño
     * 
     * @param ownerId ID del dueño del inventario
     * @param inventoryName Nombre del inventario
     * @param inventoryId ID del inventario
     */
    public void sendInventoryCreatedNotification(Long ownerId, String inventoryName, Long inventoryId) {
        NotificationMessage notification = new NotificationMessage(
                "INVENTORY_CREATED",
                "Nuevo Inventario Asignado",
                String.format("Se te ha asignado como dueño del inventario '%s'", inventoryName),
                new InventoryNotificationData(inventoryId, inventoryName)
        );
        
        // 1. Guardar en base de datos (para campanita)
        notificationPersistenceService.saveNotification(
                ownerId,
                "INVENTORY_CREATED",
                "Nuevo Inventario Asignado",
                String.format("Se te ha asignado como dueño del inventario '%s'", inventoryName),
                new InventoryNotificationData(inventoryId, inventoryName)
        );
        
        // 2. Enviar por WebSocket (para web)
        sendNotificationToUser(ownerId, notification);
    }

    /**
     * Envía una notificación cuando se asigna un inventario a un dueño
     * 
     * @param ownerId ID del nuevo dueño del inventario
     * @param inventoryName Nombre del inventario
     * @param inventoryId ID del inventario
     */
    public void sendInventoryAssignedNotification(Long ownerId, String inventoryName, Long inventoryId) {
        NotificationMessage notification = new NotificationMessage(
                "INVENTORY_CREATED",
                "Inventario Asignado",
                String.format("Se te ha asignado como dueño del inventario '%s'", inventoryName),
                new InventoryNotificationData(inventoryId, inventoryName)
        );
        
        // 1. Guardar en base de datos (para campanita)
        notificationPersistenceService.saveNotification(
                ownerId,
                "INVENTORY_CREATED",
                "Inventario Asignado",
                String.format("Se te ha asignado como dueño del inventario '%s'", inventoryName),
                new InventoryNotificationData(inventoryId, inventoryName)
        );
        
        // 2. Enviar por WebSocket (para web)
        sendNotificationToUser(ownerId, notification);
    }

    /**
     * DTO interno para datos del inventario en la notificación
     */
    public record InventoryNotificationData(
            Long inventoryId,
            String inventoryName
    ) {}
}

