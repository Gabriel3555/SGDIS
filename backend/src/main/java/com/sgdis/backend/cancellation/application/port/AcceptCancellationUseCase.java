package com.sgdis.backend.cancellation.application.port;

import com.sgdis.backend.cancellation.application.dto.AcceptCancellationRequest;
import com.sgdis.backend.cancellation.application.dto.AcceptCancellationResponse;

public interface AcceptCancellationUseCase {
    AcceptCancellationResponse acceptCancellation(AcceptCancellationRequest request);
}
