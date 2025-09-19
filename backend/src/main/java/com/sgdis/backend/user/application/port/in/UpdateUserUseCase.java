package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.UpdateUserRequest;

public interface UpdateUserUseCase {
    UpdateUserRequest execute(UpdateUserRequest request);
}
