package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.domain.User;

public interface CreateUserRepository {
    User create(CreateUserRequest request);
}
