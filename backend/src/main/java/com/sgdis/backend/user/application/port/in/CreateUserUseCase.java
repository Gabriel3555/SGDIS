package com.sgdis.backend.user.application.port.in;


import com.sgdis.backend.user.application.dto.CreateUserRequest;

public interface CreateUserUseCase {
    //create user
    CreateUserRequest createUser(CreateUserRequest userResponse);
}
