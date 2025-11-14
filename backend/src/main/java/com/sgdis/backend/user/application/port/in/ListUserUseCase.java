package com.sgdis.backend.user.application.port.in;

import com.sgdis.backend.user.application.dto.PagedUserResponse;
import com.sgdis.backend.user.application.dto.UserResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ListUserUseCase {
    List<UserResponse> listUsers();
    PagedUserResponse listUsers(Pageable pageable);
}
