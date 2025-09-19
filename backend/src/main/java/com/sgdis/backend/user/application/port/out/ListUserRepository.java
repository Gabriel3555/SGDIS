package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.domain.User;
import java.util.List;

public interface ListUserRepository {
    List<User> findAll();
}
