package com.sgdis.backend.user.application.service;

import com.sgdis.backend.user.application.dto.ManagedInventoryResponse;
import com.sgdis.backend.user.application.port.in.GetManagedInventoriesUseCase;
import com.sgdis.backend.user.application.port.out.GetManagedInventoriesRepository;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ManagedInventoriesService implements GetManagedInventoriesUseCase {

    private final GetManagedInventoriesRepository getManagedInventoriesRepository;

    @Override
    public List<ManagedInventoryResponse> getManagedInventories(Long userId) {
        return getManagedInventoriesRepository.findManagedInventoriesByUserId(userId)
                .stream()
                .map(inventory -> new ManagedInventoryResponse(
                        inventory.getId(),
                        inventory.getUuid(),
                        inventory.getName(),
                        inventory.getLocation(),
                        inventory.getOwner().getId(),
                        inventory.getOwner().getFullName(),
                        inventory.getOwner().getEmail()
                ))
                .toList();
    }
}