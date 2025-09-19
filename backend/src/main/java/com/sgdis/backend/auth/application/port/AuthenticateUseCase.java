package com.sgdis.backend.auth.application.port;

import org.springframework.security.core.Authentication;

public interface AuthenticateUseCase {
    Authentication authenticate(Long id, String password);
}
