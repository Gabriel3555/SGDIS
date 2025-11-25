package com.sgdis.backend.notification.service;

import com.sgdis.backend.notification.dto.PushNotificationRequest;
import com.sgdis.backend.notification.infrastructure.entity.DeviceTokenEntity;
import com.sgdis.backend.notification.infrastructure.repository.SpringDataDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PushNotificationService {

    private final SpringDataDeviceTokenRepository deviceTokenRepository;
    private final WebClient.Builder webClientBuilder;
    
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    /**
     * Envía una notificación push a través de Expo
     */
    public void sendPushNotification(String token, String title, String body, Map<String, Object> data) {
        try {
            PushNotificationRequest request = new PushNotificationRequest(token, title, body, data);
            
            WebClient webClient = webClientBuilder
                    .baseUrl(EXPO_PUSH_URL)
                    .build();

            webClient.post()
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(String.class)
                    .doOnSuccess(response -> 
                        log.info("Push notification enviada exitosamente: {}", response))
                    .doOnError(error -> 
                        log.error("Error al enviar push notification: {}", error.getMessage()))
                    .onErrorResume(error -> Mono.empty())
                    .subscribe();
                    
        } catch (Exception e) {
            log.error("Error al enviar push notification a token {}: {}", token, e.getMessage(), e);
        }
    }

    /**
     * Envía notificaciones push a todos los dispositivos activos de un usuario
     */
    public void sendPushNotificationToUser(Long userId, String title, String body, Map<String, Object> data) {
        try {
            List<DeviceTokenEntity> tokens = deviceTokenRepository.findByUserIdAndActiveTrue(userId);
            
            if (tokens.isEmpty()) {
                log.info("No hay tokens activos para el usuario {}", userId);
                return;
            }

            log.info("Enviando push notification a {} dispositivos del usuario {}", tokens.size(), userId);
            
            for (DeviceTokenEntity tokenEntity : tokens) {
                sendPushNotification(tokenEntity.getToken(), title, body, data);
            }
        } catch (Exception e) {
            log.error("Error al enviar push notifications al usuario {}: {}", userId, e.getMessage(), e);
        }
    }

    /**
     * Envía notificación de inventario creado
     */
    public void sendInventoryCreatedPushNotification(Long userId, String inventoryName, Long inventoryId) {
        Map<String, Object> data = new HashMap<>();
        data.put("type", "INVENTORY_CREATED");
        data.put("inventoryId", inventoryId);
        data.put("inventoryName", inventoryName);

        sendPushNotificationToUser(
            userId,
            "Nuevo Inventario Asignado",
            String.format("Se te ha asignado como dueño del inventario '%s'", inventoryName),
            data
        );
    }
}

