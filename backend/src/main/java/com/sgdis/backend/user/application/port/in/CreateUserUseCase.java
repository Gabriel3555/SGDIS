package com.sgdis.backend.user.application.port.in;


import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;

public interface CreateUserUseCase {
    UserResponse createUser(CreateUserRequest request);
}
