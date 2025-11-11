package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.ChangePasswordRequest;
import com.sgdis.backend.user.application.dto.ChangePasswordResponse;
import com.sgdis.backend.user.application.dto.ChangePasswordToUserRequest;

public interface ChangePasswordToUserUseCase {
    ChangePasswordResponse changePasswordToUser(ChangePasswordToUserRequest changePasswordToUserRequest);
}
