package com.sgdis.backend.cancellation.application.port;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface UploadFormatExampleCancellationUseCase {
    String uploadFormatExample(Long cancellationId, MultipartFile file) throws IOException;
}
