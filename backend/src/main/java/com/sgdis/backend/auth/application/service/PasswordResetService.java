package com.sgdis.backend.auth.application.service;

import com.sgdis.backend.auth.application.dto.ForgotPasswordRequest;
import com.sgdis.backend.auth.application.dto.ResetPasswordRequest;
import com.sgdis.backend.auth.infrastructure.entity.PasswordResetTokenEntity;
import com.sgdis.backend.auth.infrastructure.repository.SpringDataPasswordResetTokenRepository;
import com.sgdis.backend.email.application.port.EmailService;
import com.sgdis.backend.email.application.dto.PasswordResetEmailRequest;
import com.sgdis.backend.exception.BadRequestException;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final SpringDataUserRepository userRepository;
    private final SpringDataPasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${app.base-url:https://sgdis.cloud/}")
    private String baseUrl;
    
    @Transactional
    public void initiatePasswordReset(ForgotPasswordRequest request) {
        log.info("Initiating password reset for email: {}", request.getEmail());
        
        // Find user by email
        UserEntity user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));
        
        // Delete any existing tokens for this user
        tokenRepository.deleteByUser(user);
        
        // Generate new token
        String token = UUID.randomUUID().toString();
        
        // Create token entity
        PasswordResetTokenEntity tokenEntity = PasswordResetTokenEntity.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .used(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        tokenRepository.save(tokenEntity);
        
        // Build reset URL
        String resetUrl = baseUrl + "/reset-password.html?token=" + token;
        
        // Send email
        PasswordResetEmailRequest emailRequest = PasswordResetEmailRequest.builder()
                .to(user.getEmail())
                .username(user.getFullName())
                .resetToken(token)
                .resetUrl(resetUrl)
                .build();
        
        boolean emailSent = emailService.sendPasswordResetEmail(emailRequest);
        
        if (!emailSent) {
            log.error("Failed to send password reset email to: {}", user.getEmail());
            throw new BadRequestException("Failed to send password reset email");
        }
        
        log.info("Password reset email sent successfully to: {}", user.getEmail());
    }
    
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Attempting to reset password with token");
        
        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }
        
        // Find token
        PasswordResetTokenEntity tokenEntity = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Invalid or expired token"));
        
        // Validate token
        if (!tokenEntity.isValid()) {
            throw new BadRequestException("Token is invalid or has expired");
        }
        
        // Get user
        UserEntity user = tokenEntity.getUser();
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        // Mark token as used
        tokenEntity.setUsed(true);
        tokenRepository.save(tokenEntity);
        
        log.info("Password reset successfully for user: {}", user.getEmail());
    }
    
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Cleaning up expired password reset tokens");
        tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
    }
}