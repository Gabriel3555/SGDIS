package com.sgdis.backend.auth.application.port;

import com.sgdis.backend.auth.application.dto.RegisterRequest;

public interface RegisterUseCase {
    void register(RegisterRequest request);
}