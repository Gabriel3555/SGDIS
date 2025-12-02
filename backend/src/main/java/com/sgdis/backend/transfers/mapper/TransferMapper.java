package com.sgdis.backend.transfers.mapper;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import com.sgdis.backend.transfers.application.dto.ApproveTransferResponse;
import com.sgdis.backend.transfers.application.dto.RejectTransferResponse;
import com.sgdis.backend.transfers.application.dto.RequestTransferResponse;
import com.sgdis.backend.transfers.application.dto.TransferSummaryResponse;
import com.sgdis.backend.transfers.infrastructure.entity.TransferEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;

public final class TransferMapper {

    private TransferMapper() {
    }

    public static ApproveTransferResponse toApproveResponse(TransferEntity transfer) {
        ItemEntity item = transfer.getItem();
        InventoryEntity destinationInventory = transfer.getInventory();
        InventoryEntity sourceInventory = transfer.getSourceInventory();
        UserEntity approvedBy = transfer.getApprovedBy();
        UserEntity rejectedBy = transfer.getRejectedBy();

        return new ApproveTransferResponse(
                transfer.getId(),
                item != null ? item.getId() : null,
                item != null ? item.getProductName() : null,
                sourceInventory != null ? sourceInventory.getId() : null,
                sourceInventory != null ? sourceInventory.getName() : null,
                destinationInventory != null ? destinationInventory.getId() : null,
                destinationInventory != null ? destinationInventory.getName() : null,
                transfer.getApprovalStatus(),
                approvedBy != null ? approvedBy.getId() : null,
                approvedBy != null ? approvedBy.getFullName() : null,
                transfer.getApprovedAt(),
                transfer.getApprovalNotes(),
                "Transfer approved successfully"
        );
    }

    public static RequestTransferResponse toRequestResponse(TransferEntity transfer) {
        ItemEntity item = transfer.getItem();
        InventoryEntity destinationInventory = transfer.getInventory();
        InventoryEntity sourceInventory = transfer.getSourceInventory();
        UserEntity requester = transfer.getRequestedBy();

        return new RequestTransferResponse(
                transfer.getId(),
                item != null ? item.getId() : null,
                item != null ? item.getProductName() : null,
                sourceInventory != null ? sourceInventory.getId() : null,
                sourceInventory != null ? sourceInventory.getName() : null,
                destinationInventory != null ? destinationInventory.getId() : null,
                destinationInventory != null ? destinationInventory.getName() : null,
                transfer.getApprovalStatus(),
                requester != null ? requester.getId() : null,
                requester != null ? requester.getFullName() : null,
                transfer.getRequestedAt(),
                transfer.getDetails(),
                "Transfer request created successfully"
        );
    }

    public static TransferSummaryResponse toSummaryResponse(TransferEntity transfer) {
        ItemEntity item = transfer.getItem();
        InventoryEntity destinationInventory = transfer.getInventory();
        InventoryEntity sourceInventory = transfer.getSourceInventory();
        UserEntity requester = transfer.getRequestedBy();
        UserEntity approver = transfer.getApprovedBy();

        return new TransferSummaryResponse(
                transfer.getId(),
                item != null ? item.getId() : null,
                item != null ? item.getProductName() : null,
                item != null ? item.getLicencePlateNumber() : null,
                sourceInventory != null ? sourceInventory.getId() : null,
                sourceInventory != null ? sourceInventory.getName() : null,
                destinationInventory != null ? destinationInventory.getId() : null,
                destinationInventory != null ? destinationInventory.getName() : null,
                transfer.getApprovalStatus(),
                requester != null ? requester.getId() : null,
                requester != null ? requester.getFullName() : null,
                approver != null ? approver.getId() : null,
                approver != null ? approver.getFullName() : null,
                transfer.getRequestedAt(),
                transfer.getApprovedAt(),
                transfer.getDetails(),
                transfer.getApprovalNotes()
        );
    }

    public static RejectTransferResponse toRejectResponse(TransferEntity transfer) {
        ItemEntity item = transfer.getItem();
        InventoryEntity destinationInventory = transfer.getInventory();
        InventoryEntity sourceInventory = transfer.getSourceInventory();
        UserEntity rejectedBy = transfer.getRejectedBy();

        return new RejectTransferResponse(
                transfer.getId(),
                item != null ? item.getId() : null,
                item != null ? item.getProductName() : null,
                sourceInventory != null ? sourceInventory.getId() : null,
                sourceInventory != null ? sourceInventory.getName() : null,
                destinationInventory != null ? destinationInventory.getId() : null,
                destinationInventory != null ? destinationInventory.getName() : null,
                transfer.getApprovalStatus(),
                rejectedBy != null ? rejectedBy.getId() : null,
                rejectedBy != null ? rejectedBy.getFullName() : null,
                transfer.getRejectedAt(),
                transfer.getRejectionNotes(),
                "Transfer rejected successfully"
        );
    }
}

