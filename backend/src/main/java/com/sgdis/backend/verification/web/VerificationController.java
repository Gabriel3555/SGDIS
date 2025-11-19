package com.sgdis.backend.verification.web;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.service.FileUploadService;
import com.sgdis.backend.verification.application.dto.CreateVerificationByLicencePlateNumberRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationBySerialRequest;
import com.sgdis.backend.verification.application.dto.CreateVerificationResponse;
import com.sgdis.backend.verification.application.dto.UploadEvidenceResponse;
import com.sgdis.backend.verification.application.dto.VerificationResponse;
import com.sgdis.backend.verification.application.port.in.CreateVerificationByLicencePlateNumberUseCase;
import com.sgdis.backend.verification.application.port.in.CreateVerificationBySerialUseCase;
import com.sgdis.backend.verification.application.port.in.GetVerificationsByItemUseCase;
import com.sgdis.backend.verification.infrastructure.entity.VerificationEntity;
import com.sgdis.backend.verification.infrastructure.repository.SpringDataVerificationRepository;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/verifications")
@Tag(name = "Verification", description = "Verification management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class VerificationController {

    private final CreateVerificationBySerialUseCase createVerificationBySerialUseCase;
    private final CreateVerificationByLicencePlateNumberUseCase createVerificationByLicencePlateNumberUseCase;
    private final GetVerificationsByItemUseCase getVerificationsByItemUseCase;
    private final SpringDataVerificationRepository verificationRepository;
    private final FileUploadService fileUploadService;

    @Operation(
            summary = "Create verification by serial number",
            description = "Creates a new verification record for an item using its serial number. " +
                    "The user must be authorized to verify items from the item's inventory (owner, manager, or signatory).",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateVerificationBySerialRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Verification created successfully",
            content = @Content(schema = @Schema(implementation = CreateVerificationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or validation error")
    @ApiResponse(responseCode = "404", description = "Item not found with the provided serial number")
    @ApiResponse(responseCode = "403", description = "User not authorized to verify this item")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping("/by-serial")
    public ResponseEntity<CreateVerificationResponse> createVerificationBySerial(
            @RequestBody @Valid CreateVerificationBySerialRequest request
    ) {
        CreateVerificationResponse response = createVerificationBySerialUseCase.createVerificationBySerial(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Create verification by licence plate number",
            description = "Creates a new verification record for an item using its licence plate number. " +
                    "The user must be authorized to verify items from the item's inventory (owner, manager, or signatory).",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateVerificationByLicencePlateNumberRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Verification created successfully",
            content = @Content(schema = @Schema(implementation = CreateVerificationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request or validation error")
    @ApiResponse(responseCode = "404", description = "Item not found with the provided licence plate number")
    @ApiResponse(responseCode = "403", description = "User not authorized to verify this item")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping("/by-licence-plate")
    public ResponseEntity<CreateVerificationResponse> createVerificationByLicencePlateNumber(
            @RequestBody @Valid CreateVerificationByLicencePlateNumberRequest request
    ) {
        CreateVerificationResponse response = createVerificationByLicencePlateNumberUseCase.createVerificationByLicencePlateNumber(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Get all verifications for an item",
            description = "Retrieves all verification records for a specific item, ordered by most recent first"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Verifications retrieved successfully",
            content = @Content(schema = @Schema(implementation = VerificationResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/item/{itemId}")
    public ResponseEntity<List<VerificationResponse>> getVerificationsByItemId(
            @PathVariable Long itemId
    ) {
        List<VerificationResponse> verifications = getVerificationsByItemUseCase.getVerificationsByItemId(itemId);
        return ResponseEntity.ok(verifications);
    }

    @Operation(
            summary = "Upload evidence file for a verification",
            description = "Uploads an evidence file (photo or document) for a specific verification. " +
                    "Files are stored in uploads/verifications/{licencePlateNumber}/ directory and the generated URL is automatically appended to the verification record."
    )
    @ApiResponse(
            responseCode = "200",
            description = "File uploaded successfully and URL saved to database",
            content = @Content(schema = @Schema(implementation = UploadEvidenceResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "Verification not found")
    @ApiResponse(responseCode = "400", description = "Invalid file")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @PostMapping(value = "/{verificationId}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadEvidenceResponse> uploadVerificationEvidence(
            @PathVariable Long verificationId,
            @Parameter(
                    description = "Evidence file (image, PDF, etc.)",
                    required = true,
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            )
            @RequestPart("file") MultipartFile file
    ) {
        try {
            VerificationEntity verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Verification not found"));

            if (verification.getItem() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new UploadEvidenceResponse(
                                "Verification does not have an associated item",
                                null,
                                verificationId
                        ));
            }

            String licencePlateNumber = verification.getItem().getLicencePlateNumber();
            if (licencePlateNumber == null || licencePlateNumber.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new UploadEvidenceResponse(
                                "Item does not have a valid licence plate number",
                                null,
                                verificationId
                        ));
            }

            // Inicializar la lista de fotos si es null
            if (verification.getUrlPhotos() == null) {
                verification.setUrlPhotos(new ArrayList<>());
            }

            int fileIndex = verification.getUrlPhotos().size();
            // Guardar el archivo y obtener la URL
            String fileUrl = fileUploadService.saveVerificationFile(
                    file,
                    licencePlateNumber,
                    verificationId,
                    fileIndex
            );

            // Agregar la URL a la lista y guardar en la base de datos automáticamente
            verification.getUrlPhotos().add(fileUrl);
            verificationRepository.save(verification);

            return ResponseEntity.ok(new UploadEvidenceResponse(
                    "Evidence file uploaded successfully and URL saved to database",
                    fileUrl,
                    verificationId
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UploadEvidenceResponse(
                            "Error uploading file: " + e.getMessage(),
                            null,
                            verificationId
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new UploadEvidenceResponse(
                            "Error: " + e.getMessage(),
                            null,
                            verificationId
                    ));
        }
    }

    @Operation(
            summary = "Download evidence file for a verification",
            description = "Downloads an evidence file associated with a specific verification"
    )
    @ApiResponse(
            responseCode = "200",
            description = "File downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Verification not found or file does not exist")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/{verificationId}/evidence")
    public ResponseEntity<Resource> downloadVerificationEvidence(
            @PathVariable Long verificationId,
            @RequestParam("fileUrl") String fileUrl
    ) {
        try {
            VerificationEntity verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Verification not found"));

            if (verification.getUrlPhotos() == null || !verification.getUrlPhotos().contains(fileUrl)) {
                return ResponseEntity.notFound().build();
            }

            String relativePath = fileUrl.substring(8); // Remove "/uploads/"
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

    @Operation(
            summary = "Delete evidence file from a verification",
            description = "Deletes a specific evidence file from a verification by its URL"
    )
    @ApiResponse(
            responseCode = "200",
            description = "File deleted successfully"
    )
    @ApiResponse(responseCode = "404", description = "Verification not found or file not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @DeleteMapping("/{verificationId}/evidence")
    public ResponseEntity<String> deleteVerificationEvidence(
            @PathVariable Long verificationId,
            @RequestParam("fileUrl") String fileUrl
    ) {
        try {
            VerificationEntity verification = verificationRepository.findById(verificationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Verification not found"));

            if (verification.getUrlPhotos() == null || verification.getUrlPhotos().isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Verification has no evidence files");
            }

            if (!verification.getUrlPhotos().contains(fileUrl)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("File not found in verification");
            }

            // Remover de la lista
            verification.getUrlPhotos().remove(fileUrl);

            // Eliminar archivo físico
            try {
                fileUploadService.deleteFile(fileUrl);
            } catch (IOException e) {
                // Log error but continue with removing from database
            }

            verificationRepository.save(verification);

            return ResponseEntity.ok("Evidence file deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting file: " + e.getMessage());
        }
    }
}

