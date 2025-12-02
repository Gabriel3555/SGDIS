package com.sgdis.backend.auth.application.service;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final SpringDataUserRepository userRepository;

    public UserEntity getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        
        // Check if user is anonymous (not authenticated)
        if (principal == null || "anonymousUser".equals(principal.toString())) {
            throw new RuntimeException("Usuario no autenticado. Por favor, inicie sesión.");
        }
        
        Long userId;
        
        if (principal instanceof Long) {
            userId = (Long) principal;
        } else if (principal instanceof String) {
            String principalStr = (String) principal;
            // Skip if it's anonymousUser (already checked above, but double-check)
            if ("anonymousUser".equals(principalStr)) {
                throw new RuntimeException("Usuario no autenticado. Por favor, inicie sesión.");
            }
            try {
                userId = Long.parseLong(principalStr);
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato de ID de usuario inválido: " + principalStr);
            }
        } else if (principal instanceof Number) {
            userId = ((Number) principal).longValue();
        } else {
            throw new RuntimeException("Tipo de principal no válido: " + (principal != null ? principal.getClass().getName() : "null"));
        }
        
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }
}
