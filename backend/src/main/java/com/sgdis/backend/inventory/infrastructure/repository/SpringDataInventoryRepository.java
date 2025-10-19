package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SpringDataInventoryRepository extends JpaRepository<InventoryEntity, Long> {
    List<InventoryEntity> findInventoryEntitiesByOwnerId(Long ownerId);
    Optional<InventoryEntity> findByNameAndOwner(String name, UserEntity owner);
}
