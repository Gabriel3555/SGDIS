package com.sgdis.backend.user.application.service;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.port.in.GetManagedInventoriesUseCase;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ManagedInventoriesService implements GetManagedInventoriesUseCase {

    private final SpringDataUserRepository userRepository;

    @Override
    public List<ManagedInventoryResponse> getManagedInventories(Long userId) {
        // Get all inventories related to the user (both owned and managed)
        Set<InventoryEntity> allInventories = new HashSet<>();
        
        // Add inventories where user is a manager
        List<InventoryEntity> managedInventories = userRepository.findManagedInventoriesByUserId(userId);
        allInventories.addAll(managedInventories);
        
        // Add inventories where user is the owner
        List<InventoryEntity> ownedInventories = userRepository.findInventoriesByOwnerId(userId);
        allInventories.addAll(ownedInventories);
        
        // Convert to response DTOs
        return allInventories.stream()
                .map(inventory -> new ManagedInventoryResponse(
                        inventory.getId(),
                        inventory.getUuid(),
                        inventory.getName(),
                        inventory.getLocation(),
                        inventory.getOwner() != null ? inventory.getOwner().getId() : null,
                        inventory.getOwner() != null ? inventory.getOwner().getFullName() : null,
                        inventory.getOwner() != null ? inventory.getOwner().getEmail() : null
                ))
                .toList();
    }
}