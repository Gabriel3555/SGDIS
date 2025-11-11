package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.ChangePasswordRequest;
import com.sgdis.backend.user.application.dto.ChangePasswordResponse;

public interface ChangePasswordUseCase {
    ChangePasswordResponse changePassword(ChangePasswordRequest changePasswordRequest);
}
