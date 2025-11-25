package com.sgdis.backend.notification.infrastructure.repository;

import com.sgdis.backend.notification.infrastructure.entity.DeviceTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataDeviceTokenRepository extends JpaRepository<DeviceTokenEntity, Long> {
    
    Optional<DeviceTokenEntity> findByToken(String token);
    
    List<DeviceTokenEntity> findByUserIdAndActiveTrue(Long userId);
    
    @Modifying
    @Query("UPDATE DeviceTokenEntity d SET d.active = false WHERE d.token = :token")
    void deactivateToken(String token);
    
    @Modifying
    @Query("UPDATE DeviceTokenEntity d SET d.active = false WHERE d.user.id = :userId")
    void deactivateAllUserTokens(Long userId);
}

