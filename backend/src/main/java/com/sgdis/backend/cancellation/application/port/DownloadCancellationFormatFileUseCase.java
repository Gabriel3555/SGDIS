package com.sgdis.backend.cancellation.application.port;

import jakarta.validation.constraints.NotNull;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

public interface DownloadCancellationFormatFileUseCase {
    Resource downloadFormat(
            @NotNull Long cancellationId
    );
    
    String getFilename(@NotNull Long cancellationId);
    
    MediaType getMediaType(@NotNull Long cancellationId);
}