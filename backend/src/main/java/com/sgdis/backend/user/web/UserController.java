package com.sgdis.backend.user.web;

import com.sgdis.backend.user.application.dto.*;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.application.port.out.CreateUserRepository;
import com.sgdis.backend.user.application.service.FileUploadService;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.JpaUserRepository;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final GetUserByIdUseCase getUserByIdUseCase;
        private final ListUserUseCase listUserUseCase;
        private final CreateUserUseCase createUserUseCase;
        private final UpdateUserUseCase updateUserUseCase;
        private final DeleteUserUseCase deleteUserUseCase;
        private final GetManagedInventoriesUseCase getManagedInventoriesUseCase;
        private final AssignRegionalUseCase assignRegionalUseCase;
        private final JpaUserRepository userRepository;
        private final SpringDataUserRepository springDataUserRepository;
        private final FileUploadService fileUploadService;

    @Operation(
            summary = "Get user by ID",
            description = "Retrieves a specific user by their ID (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "User found",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @GetMapping("/users/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return getUserByIdUseCase.getUserById(id);
    }


    @Operation(
            summary = "List all users",
            description = "Retrieves all users (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied")
    @GetMapping()
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> listUsers() {
        return listUserUseCase.listUsers();
    }

    @Operation(
            summary = "Create new user",
            description = "Creates a new user (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "User created successfully",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PostMapping()
    public UserResponse createUser(@RequestBody CreateUserRequest request) {
        return createUserUseCase.createUser(request);
    }

    @Operation(
            summary = "Update user",
            description = "Updates an existing user (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "User updated successfully",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "400", description = "Invalid request")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return updateUserUseCase.updateUser(id, request);
    }

    @Operation(
            summary = "Delete user",
            description = "Deletes a user by their ID (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "User deleted successfully",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @DeleteMapping("/{id}")
    public UserResponse deleteUser(@PathVariable Long id) {
        return deleteUserUseCase.deleteUser(id);
    }

    @Operation(
            summary = "Get current user",
            description = "Retrieves the currently authenticated user information"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Current user retrieved successfully",
            content = @Content(schema = @Schema(implementation = UserResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/me")
    public UserResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (Long) authentication.getPrincipal();
        return getUserByIdUseCase.getUserById(userId);
    }

    @Operation(
            summary = "Upload profile image",
            description = "Uploads a profile image for the current user"
    )
    @ApiResponse(responseCode = "200", description = "Profile image updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid file or request")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PostMapping("/me/image")
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

    @Operation(
            summary = "Upload user image by ID",
            description = "Uploads an image for a specific user by their ID (Admin only)"
    )
    @ApiResponse(responseCode = "200", description = "User image updated successfully")
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "400", description = "Invalid file")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PostMapping("/{id}/image")
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
        
            @Operation(
                    summary = "Get managed inventories for current user",
                    description = "Retrieves all inventories managed by the currently authenticated user"
            )
            @ApiResponse(
                    responseCode = "200",
                    description = "Managed inventories retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ManagedInventoryResponse.class))
            )
            @ApiResponse(responseCode = "401", description = "Not authenticated")
            @GetMapping("/me/inventories")
            @PreAuthorize("hasRole('USER') or hasRole('WAREHOUSE') or hasRole('ADMIN')")
            public List<ManagedInventoryResponse> getMyManagedInventories() {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                Long userId = (Long) authentication.getPrincipal();
                return getManagedInventoriesUseCase.getManagedInventories(userId);
            }
        
            @Operation(
                    summary = "Get managed inventories by user ID",
                    description = "Retrieves all inventories managed by a specific user (Admin only)"
            )
            @ApiResponse(
                    responseCode = "200",
                    description = "Managed inventories retrieved successfully",
                    content = @Content(schema = @Schema(implementation = ManagedInventoryResponse.class))
            )
            @ApiResponse(responseCode = "404", description = "User not found")
            @ApiResponse(responseCode = "403", description = "Access denied")
            @GetMapping("/{userId}/inventories")
            @PreAuthorize("hasRole('ADMIN')")
            public List<ManagedInventoryResponse> getManagedInventoriesByUserId(@PathVariable Long userId) {
                return getManagedInventoriesUseCase.getManagedInventories(userId);
            }

            @PostMapping("/assignRegional")
            public AssignRegionalResponse assignRegional(AssignRegionalRequest assignRegionalRequest) {
                return assignRegionalUseCase.assignRegional(assignRegionalRequest);
             }
        
        }
