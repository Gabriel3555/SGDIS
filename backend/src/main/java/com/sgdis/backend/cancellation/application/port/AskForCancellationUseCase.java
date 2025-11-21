package com.sgdis.backend.cancellation.application.port;

import com.sgdis.backend.cancellation.application.dto.AskForCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AskForCancellationResponse;

public interface AskForCancellationUseCase {
    AskForCancellationResponse askForCancellation(AskForCancellationRequest request);
}
