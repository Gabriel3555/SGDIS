package com.sgdis.backend.notification.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.notification.dto.RegisterDeviceTokenRequest;
import com.sgdis.backend.notification.infrastructure.entity.DeviceTokenEntity;
import com.sgdis.backend.notification.infrastructure.repository.SpringDataDeviceTokenRepository;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceTokenService {

    private final SpringDataDeviceTokenRepository deviceTokenRepository;
    private final AuthService authService;

    @Transactional
    public void registerDeviceToken(RegisterDeviceTokenRequest request) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            
            // Buscar si el token ya existe
            var existingToken = deviceTokenRepository.findByToken(request.token());
            
            if (existingToken.isPresent()) {
                // Actualizar token existente
                DeviceTokenEntity token = existingToken.get();
                token.setActive(true);
                token.setLastUsedAt(LocalDateTime.now());
                token.setUser(currentUser);
                token.setDeviceType(request.deviceType());
                deviceTokenRepository.save(token);
                log.info("Token de dispositivo actualizado para usuario {}", currentUser.getId());
            } else {
                // Crear nuevo token
                DeviceTokenEntity newToken = DeviceTokenEntity.builder()
                        .token(request.token())
                        .user(currentUser)
                        .deviceType(request.deviceType())
                        .active(true)
                        .build();
                deviceTokenRepository.save(newToken);
                log.info("Nuevo token de dispositivo registrado para usuario {}", currentUser.getId());
            }
        } catch (Exception e) {
            log.error("Error al registrar token de dispositivo: {}", e.getMessage(), e);
            throw new RuntimeException("Error al registrar token de dispositivo", e);
        }
    }

    @Transactional
    public void deactivateDeviceToken(String token) {
        try {
            deviceTokenRepository.deactivateToken(token);
            log.info("Token de dispositivo desactivado: {}", token);
        } catch (Exception e) {
            log.error("Error al desactivar token: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void deactivateAllUserTokens(Long userId) {
        try {
            deviceTokenRepository.deactivateAllUserTokens(userId);
            log.info("Todos los tokens del usuario {} han sido desactivados", userId);
        } catch (Exception e) {
            log.error("Error al desactivar tokens del usuario {}: {}", userId, e.getMessage(), e);
        }
    }
}

