package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.domain.User;

public interface UpdateUserRepository {
    User update(UpdateUserRequest request);
}
