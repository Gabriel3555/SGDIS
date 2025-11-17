package com.sgdis.backend.loan.application.service;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.exception.userExceptions.RegionalNotFoundException;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.item.infrastructure.repository.SpringDataItemRepository;
import com.sgdis.backend.loan.application.dto.LendItemRequest;
import com.sgdis.backend.loan.application.dto.LendItemResponse;
import com.sgdis.backend.loan.application.dto.LoanResponse;
import com.sgdis.backend.loan.application.dto.ReturnItemRequest;
import com.sgdis.backend.loan.application.dto.ReturnItemResponse;
import com.sgdis.backend.loan.application.port.GetLastLoanByItemUseCase;
import com.sgdis.backend.loan.application.port.GetLoansByItemUseCase;
import com.sgdis.backend.loan.application.port.LendItemUseCase;
import com.sgdis.backend.loan.application.port.ReturnItemUseCase;
import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import com.sgdis.backend.loan.infrastructure.repository.SpringDataLoanRepository;
import com.sgdis.backend.loan.mapper.LoanMapper;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LoanService implements LendItemUseCase, ReturnItemUseCase, GetLoansByItemUseCase, GetLastLoanByItemUseCase {

    private final AuthService authService;
    private final SpringDataLoanRepository loanRepository;
    private final SpringDataUserRepository userRepository;
    private final SpringDataItemRepository itemRepository;

    @Override
    public LendItemResponse lendItem(LendItemRequest request) {
        UserEntity user = authService.getCurrentUser();

        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        // Check if the item has been returned in its last loan
        Optional<LoanEntity> lastLoan = loanRepository.findLastLoanByItemId(request.itemId());
        if (lastLoan.isPresent() && !Boolean.TRUE.equals(lastLoan.get().getReturned())) {
            throw new IllegalStateException("Item cannot be lent because it has not been returned from its last loan");
        }

        LoanEntity loanEntity = LoanMapper.toEntity(request, item, user);

        // Sincronizar relación bidireccional: setear el item en el loan y agregar el loan a la lista de préstamos del item
        loanEntity.setItem(item);
        if (item.getLoans() == null) {
            item.setLoans(new ArrayList<>());
        }
        if (!item.getLoans().contains(loanEntity)) {
            item.getLoans().add(loanEntity);
        }

        loanRepository.save(loanEntity);

        return new LendItemResponse(user.getFullName(), "Item prestado exitosamente a " + loanEntity.getResponsibleName());
    }

    @Override
    public ReturnItemResponse returnItem(ReturnItemRequest request) {
        UserEntity user = authService.getCurrentUser();

        LoanEntity loanEntity = loanRepository.findById(request.loanId())
                .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

        if (Boolean.TRUE.equals(loanEntity.getReturned())) {
            throw new IllegalStateException("Item already returned");
        }

        loanEntity.setReturned(true);
        loanEntity.setDetailsReturn(request.detailsReturn());
        loanEntity.setReturnAt(LocalDateTime.now());

        // Sincronizar relación bidireccional: asegurar que el loan está en la lista de préstamos del item
        ItemEntity item = loanEntity.getItem();
        if (item != null) {
            if (item.getLoans() == null) {
                item.setLoans(new ArrayList<>());
            }
            if (!item.getLoans().contains(loanEntity)) {
                item.getLoans().add(loanEntity);
            }
        }

        loanRepository.save(loanEntity);

        return new ReturnItemResponse(user.getFullName(), "Item devuelto exitosamente");
    }

    @Override
    public List<LoanResponse> getLoansByItemId(Long itemId) {
        // Verificar que el item existe
        itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        List<LoanEntity> loans = loanRepository.findAllByItemId(itemId);
        return loans.stream()
                .map(LoanMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<LoanResponse> getLastLoanByItemId(Long itemId) {
        // Verificar que el item existe
        itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found"));

        Optional<LoanEntity> lastLoan = loanRepository.findLastLoanByItemId(itemId);
        return lastLoan.map(LoanMapper::toDto);
    }
}
