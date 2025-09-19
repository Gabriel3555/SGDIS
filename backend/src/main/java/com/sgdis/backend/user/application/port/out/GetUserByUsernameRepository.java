package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.domain.User;

import java.util.Optional;

public interface GetUserByUsernameRepository {
    User findUserByUsername(String username);
}