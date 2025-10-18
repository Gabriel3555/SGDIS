package com.sgdis.backend.user.web;

import com.sgdis.backend.user.application.dto.CreateUserRequest;
import com.sgdis.backend.user.application.dto.UpdateUserRequest;
import com.sgdis.backend.user.application.dto.UserResponse;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.application.port.out.CreateUserRepository;
import com.sgdis.backend.user.application.service.FileUploadService;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.JpaUserRepository;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final GetUserByIdUseCase getUserByIdUseCase;
    private final ListUserUseCase listUserUseCase;
    private final CreateUserUseCase createUserUseCase;
    private final UpdateUserUseCase updateUserUseCase;
    private final DeleteUserUseCase deleteUserUseCase;
    private final JpaUserRepository userRepository;
    private final SpringDataUserRepository springDataUserRepository;
    private final FileUploadService fileUploadService;

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUserById(@PathVariable Long id) {
        return getUserByIdUseCase.getUserById(id);
    }


    @GetMapping()
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return listUserUseCase.listUsers();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return createUserUseCase.createUser(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return updateUserUseCase.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse deleteUser(@PathVariable Long id) {
        return deleteUserUseCase.deleteUser(id);
    }

    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (Long) authentication.getPrincipal();
        return getUserByIdUseCase.getUserById(userId);
    }

    @PostMapping("/me/image")
    @PreAuthorize("hasRole('USER') or hasRole('WAREHOUSE')")
    public ResponseEntity<String> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();
            User user = userRepository.findUserById(userId);

            if (user.getImgUrl() != null) {
                fileUploadService.deleteFile(user.getImgUrl());
            }

            String imgUrl = fileUploadService.saveFile(file, user.getEmail());
            user.setImgUrl(imgUrl);

            UserEntity entity = UserMapper.toEntity(user);
            springDataUserRepository.save(entity);
            return ResponseEntity.ok("Profile image updated successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating profile image: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> uploadUserImageById(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        try {
            User user = userRepository.findUserById(id);

            if (user.getImgUrl() != null) {
                fileUploadService.deleteFile(user.getImgUrl());
            }

            String imgUrl = fileUploadService.saveFile(file, user.getEmail());
            user.setImgUrl(imgUrl);

            UserEntity entity = UserMapper.toEntity(user);
            springDataUserRepository.save(entity);
            return ResponseEntity.ok("User image updated successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating user image: " + e.getMessage());
        }
    }

}
