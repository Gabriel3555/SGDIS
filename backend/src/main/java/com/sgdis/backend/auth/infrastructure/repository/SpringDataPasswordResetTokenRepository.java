package com.sgdis.backend.auth.infrastructure.repository;

import com.sgdis.backend.auth.infrastructure.entity.PasswordResetTokenEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SpringDataPasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, Long> {
    
    Optional<PasswordResetTokenEntity> findByToken(String token);
    
    Optional<PasswordResetTokenEntity> findByUserAndUsedFalseAndExpiryDateAfter(UserEntity user, LocalDateTime now);
    
    void deleteByExpiryDateBefore(LocalDateTime now);
    
    void deleteByUser(UserEntity user);
}