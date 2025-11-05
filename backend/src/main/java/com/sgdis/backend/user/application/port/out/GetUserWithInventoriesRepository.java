package com.sgdis.backend.user.application.port.out;

import com.sgdis.backend.user.domain.User;

public interface GetUserWithInventoriesRepository {
    User getUserWithInventories(Long userId);
}