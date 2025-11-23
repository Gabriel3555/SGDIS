package com.sgdis.backend.cancellation.web;

import com.sgdis.backend.cancellation.application.dto.AcceptCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AcceptCancellationResponse;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.application.dto.RefuseCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.RefuseCancellationResponse;
import com.sgdis.backend.cancellation.application.port.AcceptCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.AskForCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.DownloadCancellationFormatFileUseCase;
import com.sgdis.backend.cancellation.application.port.DownloadCancellationFormatExampleFileUseCase;
import com.sgdis.backend.cancellation.application.port.RefuseCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.UploadFormatCancellationUseCase;
import com.sgdis.backend.cancellation.application.port.UploadFormatExampleCancellationUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/cancellations")
@Tag(name = "Cancellation", description = "Cancellation management endpoints")
public class CancellationController {

    private final AskForCancellationUseCase askForCancellationUseCase;
    private final AcceptCancellationUseCase acceptCancellationUseCase;
    private final RefuseCancellationUseCase refuseCancellationUseCase;
    private final UploadFormatCancellationUseCase uploadFormatCancellationUseCase;
    private final DownloadCancellationFormatFileUseCase downloadCancellationFormatFileUseCase;
    private final DownloadCancellationFormatExampleFileUseCase downloadCancellationFormatExampleFileUseCase;
    private final UploadFormatExampleCancellationUseCase uploadFormatExampleCancellationUseCase;

    @Operation(
            summary = "Ask for cancellation",
            description = "Submits a request to cancel an item",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = AskForCancellationRequest.class)
                    )
            )
    )
    @ApiResponse(
            responseCode = "201",
            description = "Cancellation request submitted successfully",
            content = @Content(schema = @Schema(implementation = AskForCancellationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Item not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/ask")
    public ResponseEntity<AskForCancellationResponse> askForCancellation(
            @Valid @RequestBody AskForCancellationRequest request
    ) {
        var response = askForCancellationUseCase.askForCancellation(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
            summary = "Download cancellation format file",
            description = "Downloads the format file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format file downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Cancellation or format file not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/{cancellationId}/download-format")
    public ResponseEntity<Resource> downloadFormatFile(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId
    ) {
        try {
            Resource resource = downloadCancellationFormatFileUseCase.downloadFormat(cancellationId);
            String filename = downloadCancellationFormatFileUseCase.getFilename(cancellationId);
            MediaType mediaType = downloadCancellationFormatFileUseCase.getMediaType(cancellationId);
            
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
            summary = "Download cancellation format example file",
            description = "Downloads the format example file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format example file downloaded successfully"
    )
    @ApiResponse(responseCode = "404", description = "Cancellation or format example file not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @GetMapping("/{cancellationId}/download-format-example")
    public ResponseEntity<Resource> downloadFormatExampleFile(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId
    ) {
        try {
            Resource resource = downloadCancellationFormatExampleFileUseCase.downloadFormatExample(cancellationId);
            String filename = downloadCancellationFormatExampleFileUseCase.getFilenameExample(cancellationId);
            MediaType mediaType = downloadCancellationFormatExampleFileUseCase.getMediaTypeExample(cancellationId);
            
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(
            summary = "Upload format example file",
            description = "Uploads a format example file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format example file uploaded successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid file or request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{cancellationId}/upload-format-example")
    public ResponseEntity<String> uploadFormatExample(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Parameter(description = "Format example file", required = true)
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String message = uploadFormatExampleCancellationUseCase.uploadFormatExample(cancellationId, file);
            return ResponseEntity.ok(message);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al subir el archivo: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Cancelación no encontrada");
        }
    }

    @Operation(
            summary = "Accept cancellation",
            description = "Accepts a cancellation request with the provided comments"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellation accepted successfully",
            content = @Content(schema = @Schema(implementation = AcceptCancellationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{cancellationId}/accept")
    public ResponseEntity<AcceptCancellationResponse> acceptCancellation(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Valid @RequestBody RefuseCancellationRequest request
    ) {
        // Verify that the cancellationId in the path matches the one in the request
        if (!cancellationId.equals(request.cancellationId())) {
            return ResponseEntity.badRequest().build();
        }

        var acceptRequest = new AcceptCancellationRequest(cancellationId, request.comment());
        var response = acceptCancellationUseCase.acceptCancellation(acceptRequest);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Refuse cancellation",
            description = "Refuses a cancellation request with the provided comments"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Cancellation refused successfully",
            content = @Content(schema = @Schema(implementation = RefuseCancellationResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{cancellationId}/refuse")
    public ResponseEntity<RefuseCancellationResponse> refuseCancellation(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Valid @RequestBody RefuseCancellationRequest request
    ) {
        // Verify that the cancellationId in the path matches the one in the request
        if (!cancellationId.equals(request.cancellationId())) {
            return ResponseEntity.badRequest().build();
        }

        var response = refuseCancellationUseCase.refuseCancellation(request);
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "Upload cancellation format file",
            description = "Uploads a format file for a specific cancellation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Format file uploaded successfully"
    )
    @ApiResponse(responseCode = "400", description = "Invalid file or request")
    @ApiResponse(responseCode = "404", description = "Cancellation not found")
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping("/{cancellationId}/upload-format")
    public ResponseEntity<String> uploadFormat(
            @Parameter(description = "Cancellation ID", required = true)
            @NotNull @PathVariable Long cancellationId,
            @Parameter(description = "Format file", required = true)
            @RequestParam("file") MultipartFile file
    ) {
        try {
            String message = uploadFormatCancellationUseCase.uploadFormat(cancellationId, file);
            return ResponseEntity.ok(message);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al subir el archivo: " + e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Cancelación no encontrada");
        }
    }
}
