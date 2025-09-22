package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.UserResponse;

import java.util.List;

public interface ListUserUseCase {
    List<UserResponse> listUsers();
}
