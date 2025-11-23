package com.sgdis.backend.cancellation.application.port;

import com.sgdis.backend.cancellation.application.dto.RefuseCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.RefuseCancellationResponse;

public interface RefuseCancellationUseCase {
    RefuseCancellationResponse refuseCancellation(RefuseCancellationRequest request);
}
