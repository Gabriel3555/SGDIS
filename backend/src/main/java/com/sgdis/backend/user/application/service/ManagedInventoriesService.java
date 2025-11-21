package com.sgdis.backend.user.application.service;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.port.in.GetManagedInventoriesUseCase;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ManagedInventoriesService implements GetManagedInventoriesUseCase {

    private final SpringDataUserRepository userRepository;

    @Override
    public List<ManagedInventoryResponse> getManagedInventories(Long userId) {
        List<InventoryEntity> combinedInventories = new ArrayList<>();

        List<InventoryEntity> managedInventories = userRepository.findManagedInventoriesByUserId(userId);
        combinedInventories.addAll(managedInventories);

        List<InventoryEntity> ownedInventories = userRepository.findInventoriesByOwnerId(userId);
        combinedInventories.addAll(ownedInventories);

        Map<Long, InventoryEntity> uniqueInventories = new LinkedHashMap<>();
        for (InventoryEntity inventory : combinedInventories) {
            if (inventory != null && inventory.getId() != null) {
                uniqueInventories.putIfAbsent(inventory.getId(), inventory);
            }
        }

        return uniqueInventories.values().stream()
                .map(inventory -> new ManagedInventoryResponse(
                        inventory.getId(),
                        inventory.getUuid(),
                        inventory.getName(),
                        inventory.getLocation(),
                        inventory.getOwner() != null ? inventory.getOwner().getId() : null,
                        inventory.getOwner() != null ? inventory.getOwner().getFullName() : null,
                        inventory.getOwner() != null ? inventory.getOwner().getEmail() : null,
                        inventory.isStatus()
                ))
                .toList();
    }
}