package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.domain.User;

public interface GetUserByEmailRepository {
    User findUserByEmail(String email);
}