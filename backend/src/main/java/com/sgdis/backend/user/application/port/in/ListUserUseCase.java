package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.UserResponse;

public interface ListUserUseCase {
    UserResponse listUsers();
}
