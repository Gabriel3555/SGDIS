package com.sgdis.backend.auth.application.port;


import com.sgdis.backend.auth.application.dto.AuthRequest;
import com.sgdis.backend.auth.application.dto.AuthResponse;

public interface LoginUseCase {
    AuthResponse login(AuthRequest authRequest);
}
