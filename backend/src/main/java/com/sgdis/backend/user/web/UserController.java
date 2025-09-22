package com.sgdis.backend.user.web;

import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.application.port.out.CreateUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final GetUserByIdUseCase getUserByIdUseCase;
    private final ListUserUseCase listUserUseCase;
    private final CreateUserUseCase createUserUseCase;
    private final UpdateUserUseCase updateUserUseCase;
    private final DeleteUserUseCase deleteUserUseCase;

    @GetMapping("/users/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return getUserByIdUseCase.getUserById(id);
    }


    @GetMapping()
    public List<UserResponse> listUsers() {
        return listUserUseCase.listUsers();
    }

    // 🔹 Crear usuario
    @PostMapping
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return createUserUseCase.createUser(request);
    }

    // 🔹 Actualizar usuario
    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return updateUserUseCase.updateUser(id, request);
    }

    // 🔹 Eliminar usuario
    @DeleteMapping("/{id}")
    public UserResponse deleteUser(@PathVariable Long id) {
        return deleteUserUseCase.deleteUser(id);
    }



}
