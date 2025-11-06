package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SpringDataUserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);
    @Query("SELECT i FROM InventoryEntity i JOIN i.managers m WHERE m.id = :userId")
    List<InventoryEntity> findManagedInventoriesByUserId(Long userId);
}