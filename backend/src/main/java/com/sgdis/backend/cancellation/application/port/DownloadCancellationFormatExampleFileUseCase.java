package com.sgdis.backend.cancellation.application.port;

import jakarta.validation.constraints.NotNull;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

public interface DownloadCancellationFormatExampleFileUseCase {
    Resource downloadFormatExample(
            @NotNull Long cancellationId
    );
    
    String getFilenameExample(@NotNull Long cancellationId);
    
    MediaType getMediaTypeExample(@NotNull Long cancellationId);
}