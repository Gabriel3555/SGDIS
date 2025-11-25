package com.sgdis.backend.transfers.application.dto;

import jakarta.validation.constraints.Size;

public record ApproveTransferRequest(
        @Size(max = 500, message = "Las notas no pueden superar los 500 caracteres")
        String approvalNotes
) {
}






