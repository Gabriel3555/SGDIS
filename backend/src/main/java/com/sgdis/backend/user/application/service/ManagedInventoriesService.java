package com.sgdis.backend.user.application.service;

import com.sgdis.backend.inventory.infrastructure.repository.SpringDataInventoryRepository;
import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.port.in.GetManagedInventoriesUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagedInventoriesService implements GetManagedInventoriesUseCase {

    private final SpringDataInventoryRepository inventoryRepository;

    @Override
    public List<ManagedInventoryResponse> getManagedInventories(Long userId) {
        return inventoryRepository.findInventoryEntitiesByManagerId(userId)
                .stream()
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