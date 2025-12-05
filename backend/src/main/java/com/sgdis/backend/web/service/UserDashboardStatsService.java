package com.sgdis.backend.web.service;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.web.dto.UserDashboardStatsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserDashboardStatsService {

    private final SpringDataItemRepository itemRepository;
    private final SpringDataInventoryRepository inventoryRepository;
    private final SpringDataUserRepository userRepository;

    @Transactional(readOnly = true)
    public UserDashboardStatsResponse getDashboardStats(Long userId) {
        log.info("Obteniendo estadísticas del dashboard de user - UserId: {}", userId);

        return UserDashboardStatsResponse.builder()
                .itemStats(getItemStats(userId))
                .inventoryStats(getInventoryStats(userId))
                .build();
    }

    private UserDashboardStatsResponse.ItemStats getItemStats(Long userId) {
        // Get all inventories where user is owner, manager, or signatory
        List<InventoryEntity> ownedInventories = userRepository.findInventoriesByOwnerId(userId);
        List<InventoryEntity> managedInventories = userRepository.findManagedInventoriesByUserId(userId);
        
        // Get signatory inventories
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        List<InventoryEntity> signatoryInventories = user.getMySignatories();
        if (signatoryInventories == null) {
            signatoryInventories = List.of();
        } else {
            // Initialize the collection to avoid LazyInitializationException
            signatoryInventories.size();
        }
        
        // Combine all inventories and get unique IDs
        Set<Long> inventoryIds = new HashSet<>();
        ownedInventories.forEach(inv -> {
            if (inv != null && inv.getId() != null) {
                inventoryIds.add(inv.getId());
            }
        });
        managedInventories.forEach(inv -> {
            if (inv != null && inv.getId() != null) {
                inventoryIds.add(inv.getId());
            }
        });
        signatoryInventories.forEach(inv -> {
            if (inv != null && inv.getId() != null) {
                inventoryIds.add(inv.getId());
            }
        });
        
        // Get all items from user's inventories
        List<ItemEntity> allItems = new ArrayList<>();
        for (Long inventoryId : inventoryIds) {
            try {
                List<ItemEntity> items = itemRepository.findAllByInventoryId(inventoryId);
                if (items != null) {
                    allItems.addAll(items);
                }
            } catch (Exception e) {
                log.warn("Error loading items for inventory {}: {}", inventoryId, e.getMessage());
            }
        }
        
        long totalItems = allItems.size();
        long activeItems = allItems.stream()
                .filter(item -> item.isStatus())
                .count();
        long inactiveItems = totalItems - activeItems;
        // Note: ItemEntity doesn't have a MAINTENANCE status field, so maintenanceItems will be 0
        // This matches the frontend logic that checks for item.status === 'MAINTENANCE'
        long maintenanceItems = 0;
        
        BigDecimal totalValue = allItems.stream()
                .map(item -> BigDecimal.valueOf(item.getAcquisitionValue() != null ? item.getAcquisitionValue() : 0.0))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return UserDashboardStatsResponse.ItemStats.builder()
                .totalItems(totalItems)
                .activeItems(activeItems)
                .maintenanceItems(maintenanceItems)
                .inactiveItems(inactiveItems)
                .totalValue(totalValue)
                .build();
    }

    private UserDashboardStatsResponse.InventoryStats getInventoryStats(Long userId) {
        // Get all inventories where user is owner, manager, or signatory
        List<InventoryEntity> ownedInventories = userRepository.findInventoriesByOwnerId(userId);
        List<InventoryEntity> managedInventories = userRepository.findManagedInventoriesByUserId(userId);
        
        // Get signatory inventories
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        List<InventoryEntity> signatoryInventories = user.getMySignatories();
        if (signatoryInventories == null) {
            signatoryInventories = List.of();
        } else {
            // Initialize the collection to avoid LazyInitializationException
            signatoryInventories.size();
        }
        
        // Combine all inventories and get unique count
        Set<Long> inventoryIds = new HashSet<>();
        ownedInventories.forEach(inv -> {
            if (inv != null && inv.getId() != null) {
                inventoryIds.add(inv.getId());
            }
        });
        managedInventories.forEach(inv -> {
            if (inv != null && inv.getId() != null) {
                inventoryIds.add(inv.getId());
            }
        });
        signatoryInventories.forEach(inv -> {
            if (inv != null && inv.getId() != null) {
                inventoryIds.add(inv.getId());
            }
        });
        
        long totalInventories = inventoryIds.size();

        return UserDashboardStatsResponse.InventoryStats.builder()
                .totalInventories(totalInventories)
                .build();
    }
}

