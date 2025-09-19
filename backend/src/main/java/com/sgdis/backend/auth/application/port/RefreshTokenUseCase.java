package com.sgdis.backend.auth.application.port;

import com.sgdis.backend.auth.application.dto.RefreshTokenRequest;
import com.sgdis.backend.auth.application.dto.RefreshTokenResponse;

public interface RefreshTokenUseCase {
    RefreshTokenResponse refreshToken(RefreshTokenRequest request);
}
