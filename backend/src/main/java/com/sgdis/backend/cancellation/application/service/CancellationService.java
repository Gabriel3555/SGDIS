package com.sgdis.backend.cancellation.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.application.port.AskForCancellationUseCase;
import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import com.sgdis.backend.cancellation.infrastructure.repository.SpringDataCancellationRepository;
import com.sgdis.backend.cancellation.mapper.CancellationMapper;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
public class CancellationService implements AskForCancellationUseCase {

    private final SpringDataCancellationRepository cancellationRepository;
    private final SpringDataItemRepository itemRepository;
    private final AuthService authService;

    @Override
    public AskForCancellationResponse askForCancellation(AskForCancellationRequest request) {
        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new RuntimeException("Item no encontrado con ID: " + request.itemId()));

        UserEntity requester = authService.getCurrentUser();

        CancellationEntity entity = new CancellationEntity();
        entity.setItem(item);
        entity.setRequester(requester);
        entity.setReason(request.reason());
        entity.setRequestedAt(LocalDateTime.now());
        entity.setApproved(false);

        CancellationEntity savedEntity = cancellationRepository.save(entity);

        return CancellationMapper.toResponse(savedEntity);
    }
}
