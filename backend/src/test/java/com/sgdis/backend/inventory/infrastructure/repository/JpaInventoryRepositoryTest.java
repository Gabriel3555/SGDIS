/*package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.domain.Inventory;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class JpaInventoryRepositoryTest {

    @Autowired
    private SpringDataInventoryRepository springDataInventoryRepository;

    private JpaInventoryRepository buildRepository() {
        return new JpaInventoryRepository(springDataInventoryRepository);
    }

    @Test
    void createInventory() {
        var repo = buildRepository();
        Inventory inventory = new Inventory(null, UUID.randomUUID(), "Bodega", "Laptop", null);

        Inventory saved = repo.createInventory(inventory);

        assertNotNull(saved.getId());
        assertEquals("Laptop", saved.getName());
    }

    @Test
    void findAllInventoryes() {
        var repo = buildRepository();
        springDataInventoryRepository.save(new InventoryEntity(null, UUID.randomUUID(), "Bodega", "Laptop", null));

        List<Inventory> list = repo.findAllInventoryes();

        assertFalse(list.isEmpty());
        assertEquals("Laptop", list.get(0).getName());
    }

    @Test
    void getInventoryById() {
        var repo = buildRepository();
        InventoryEntity entity = springDataInventoryRepository.save(new InventoryEntity(null, UUID.randomUUID(), "Bodega", "Laptop", null));

        Inventory found = repo.getInventoryById(entity.getId());

        assertEquals("Laptop", found.getName());
    }

    @Test
    void deleteInventory() {
        var repo = buildRepository();
        InventoryEntity entity = springDataInventoryRepository.save(new InventoryEntity(null, UUID.randomUUID(), "Bodega", "Laptop", null));

        repo.deleteInventory(entity.getId());

        assertFalse(springDataInventoryRepository.findById(entity.getId()).isPresent());
    }

    @Test
    void updateInventory() {
        var repo = buildRepository();
        InventoryEntity entity = springDataInventoryRepository.save(new InventoryEntity(null, UUID.randomUUID(), "Bodega", "Laptop", null));

        Inventory updated = new Inventory(entity.getId(), entity.getUuid(), "Oficina", "Impresora", null);

        Inventory result = repo.updateInventory(updated);

        assertEquals("Impresora", result.getName());
        assertEquals("Oficina", result.getLocation());
    }

    @Test
    void asignedInventory() {
        var repo = buildRepository();
        InventoryEntity entity = springDataInventoryRepository.save(new InventoryEntity(null, UUID.randomUUID(), "Bodega", "Laptop", null));

        Inventory inventory = InventoryMapper.toDomain(entity);
        Inventory result = repo.asignedInventory(inventory);

        assertNotNull(result.getId());
        assertEquals("Laptop", result.getName());
    }
}

 */
