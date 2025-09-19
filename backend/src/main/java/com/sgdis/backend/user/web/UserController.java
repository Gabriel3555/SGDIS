package com.sgdis.backend.user.web;

import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.application.port.in.GetUserByIdUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final GetUserByIdUseCase getUserByIdUseCase;

    @GetMapping("/users/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return getUserByIdUseCase.getUserById(id);
    }
}
