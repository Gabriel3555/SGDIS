package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;

public interface UpdateUserUseCase {
    UserResponse updateUser(Long id, UpdateUserRequest request);
}
