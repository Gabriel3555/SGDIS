package com.sgdis.backend.loan.mapper;

import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.loan.application.dto.LendItemRequest;
import com.sgdis.backend.loan.application.dto.LendItemResponse;
import com.sgdis.backend.loan.application.dto.LoanResponse;
import com.sgdis.backend.loan.application.dto.ReturnItemRequest;
import com.sgdis.backend.loan.application.dto.ReturnItemResponse;
import com.sgdis.backend.loan.infrastructure.entity.LoanEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

import java.time.LocalDateTime;

public final class LoanMapper {

    private LoanMapper() {}

    public static LoanEntity toEntity(LendItemRequest request, ItemEntity item, UserEntity lender, UserEntity responsible) {
        return LoanEntity.builder()
                .lendAt(LocalDateTime.now())
                .detailsLend(request.details())
                .responsible(responsible)
                .item(item)
                .lender(lender)
                .build();
    }

    public static LoanResponse toDto(LoanEntity entity) {
        return new LoanResponse(
                entity.getId(),
                entity.getLender() != null ? entity.getLender().getId() : null,
                entity.getLender() != null ? entity.getLender().getFullName() : null,
                entity.getItem() != null ? entity.getItem().getId() : null,
                entity.getItem() != null ? entity.getItem().getLicencePlateNumber() : null,
                entity.getResponsible() != null ? entity.getResponsible().getId() : null,
                entity.getResponsible() != null ? entity.getResponsible().getFullName() : null,
                entity.getDetailsLend(),
                entity.getDetailsReturn(),
                entity.getLendAt(),
                entity.getReturnAt(),
                entity.getReturned()
        );
    }
}
