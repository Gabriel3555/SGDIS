package com.sgdis.backend.cancellation.web;

import com.sgdis.backend.cancellation.application.dto.AskForCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;
import com.sgdis.backend.cancellation.application.port.AskForCancellationUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/cancellations")
@Tag(name = "Cancellation", description = "Cancellation management endpoints")
public class CancellationController {

    private final AskForCancellationUseCase askForCancellationUseCase;

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
}
