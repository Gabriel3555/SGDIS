package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataInventoryRepository extends JpaRepository<InventoryEntity, Long> {
    List<InventoryEntity> findInventoryEntitiesByOwnerId(Long ownerId);
}
