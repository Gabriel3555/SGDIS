package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataInventoryRepository extends JpaRepository<InventoryEntity, Long> {
}
