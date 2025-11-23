package com.sgdis.backend.cancellation.application.port;

import jakarta.validation.constraints.NotNull;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface UploadFormatCancellationUseCase {
    String uploadFormat(
            @NotNull Long cancellationId,
            @NotNull(message = "Debe adjuntar el formato tecnico") MultipartFile file
    ) throws IOException;
}
