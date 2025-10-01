package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.application.port.out.CreateInventoryRepository;
import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class JpaInventoryRepository implements CreateInventoryRepository {

    private final SpringDataInventoryRepository springDataInventoryRepository;

    @Override
    public Inventory createInventory(Inventory inventory) {
        InventoryEntity inventoryEntity = new InventoryEntity(null,inventory.getUuid(),inventory.getLocation(),inventory.getName(),null);

        InventoryEntity savedInventoryEntity = springDataInventoryRepository.save(inventoryEntity);

        return new Inventory(savedInventoryEntity.getId(),savedInventoryEntity.getUuid(),savedInventoryEntity.getLocation(),savedInventoryEntity.getName(),null);
    }
}
