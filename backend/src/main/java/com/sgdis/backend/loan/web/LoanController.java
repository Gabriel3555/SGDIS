package com.sgdis.backend.loan.web;

import com.sgdis.backend.exception.ResourceNotFoundException;
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
import com.sgdis.backend.user.application.service.FileUploadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/loan")
@Tag(name = "Loan Management", description = "Operations related to loan management")
public class LoanController {

    private final LendItemUseCase lendItemUseCase;
    private final ReturnItemUseCase returnItemUseCase;
    private final GetLoansByItemUseCase getLoansByItemUseCase;
    private final GetLastLoanByItemUseCase getLastLoanByItemUseCase;
    private final SpringDataLoanRepository loanRepository;
    private final FileUploadService fileUploadService;

    @PostMapping("/lend")
    @Operation(
            summary = "Lend an item",
            description = "Create a new loan record for an item to a responsible person"
    )
    @ApiResponse(
            responseCode = "201",
            description = "Item lent successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or item cannot be lent")
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<LendItemResponse> lendItem(@RequestBody LendItemRequest request) {
        LendItemResponse response = lendItemUseCase.lendItem(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/return")
    @Operation(
            summary = "Return an item",
            description = "Mark a loan as returned"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Item returned successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or item cannot be returned")
    @ApiResponse(responseCode = "404", description = "Loan not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<ReturnItemResponse> returnItem(@RequestBody ReturnItemRequest request) {
        ReturnItemResponse response = returnItemUseCase.returnItem(request);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/item/{itemId}")
    @Operation(
            summary = "List all loans for an item",
            description = "Retrieves all loan records for a specific item, ordered by most recent first"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Loans retrieved successfully"
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<List<LoanResponse>> getLoansByItemId(@PathVariable Long itemId) {
        List<LoanResponse> loans = getLoansByItemUseCase.getLoansByItemId(itemId);
        return ResponseEntity.ok(loans);
    }

    @GetMapping("/item/{itemId}/last")
    @Operation(
            summary = "Get last loan for an item",
            description = "Retrieves the most recent loan record for a specific item"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Last loan retrieved successfully"
    )
    @ApiResponse(responseCode = "404", description = "Item not found or no loans exist")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<LoanResponse> getLastLoanByItemId(@PathVariable Long itemId) {
        Optional<LoanResponse> lastLoan = getLastLoanByItemUseCase.getLastLoanByItemId(itemId);
        return lastLoan.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/{loanId}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload document for a loan",
            description = "Uploads a document file for a specific loan. Supports PDF, images, and other document formats"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Document uploaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Loan not found")
    @ApiResponse(responseCode = "400", description = "Invalid file")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<String> uploadLoanDocument(
            @PathVariable Long loanId,
            @Parameter(
                    description = "Documento adjunto para el préstamo",
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestParam("file") MultipartFile file) {
        try {
            LoanEntity loan = loanRepository.findById(loanId)
                    .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

            if (loan.getDocumentUrl() != null) {
                try {
                    fileUploadService.deleteFile(loan.getDocumentUrl());
                } catch (IOException e) {
                }
            }

            String documentUrl = fileUploadService.saveLoanDocument(file, loanId);
            loan.setDocumentUrl(documentUrl);
            loanRepository.save(loan);

            return ResponseEntity.ok("Document uploaded successfully");
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading document: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{loanId}/document")
    @Operation(
            summary = "Download document for a loan",
            description = "Downloads the document file associated with a specific loan"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Document downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Loan not found or document does not exist")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    public ResponseEntity<Resource> downloadLoanDocument(@PathVariable Long loanId) {
        try {
            LoanEntity loan = loanRepository.findById(loanId)
                    .orElseThrow(() -> new ResourceNotFoundException("Loan not found"));

            if (loan.getDocumentUrl() == null || loan.getDocumentUrl().isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            String relativePath = loan.getDocumentUrl().substring(8);
            Path filePath = Paths.get("uploads").resolve(relativePath).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = "application/octet-stream";
            String filename = filePath.getFileName().toString();
            if (filename.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (filename.endsWith(".png")) {
                contentType = "image/png";
            } else if (filename.endsWith(".doc") || filename.endsWith(".docx")) {
                contentType = "application/msword";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
