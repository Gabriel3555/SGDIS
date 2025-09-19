package com.sgdis.backend.auth.application.port.in;

import com.sgdis.backend.auth.application.dto.UserResponse;

public interface GetUserByIdUseCase {
    UserResponse getUserById(Long id);
}
