package com.sgdis.backend.user.web;

import com.sgdis.backend.auth.application.service.AuthService;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.loan.application.dto.LoanResponse;
import com.sgdis.backend.loan.application.port.GetMyLoansUseCase;
import com.sgdis.backend.user.application.dto.*;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.domain.Role;
import org.springframework.security.access.prepost.PreAuthorize;
import com.sgdis.backend.user.mapper.UserMapper;
import com.sgdis.backend.file.service.FileUploadService;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.inventory.application.dto.InventoryResponse;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

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
    private final ChangePasswordUseCase changePasswordUseCase;
    private final ChangePasswordToUserUseCase changePasswordToUserUseCase;
    private final GetManagedInventoriesUseCase getManagedInventoriesUseCase;
    private final SpringDataUserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final AuthService authService;
    private final GetMyLoansUseCase getMyLoansUseCase;

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
    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {
        return getUserByIdUseCase.getUserById(id);
    }

    @Operation(
            summary = "List all users",
            description = "Retrieves all users with pagination (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(schema = @Schema(implementation = PagedUserResponse.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied")
    @GetMapping
    public PagedUserResponse listUsers(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "6") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return listUserUseCase.listUsers(pageable);
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
    @PostMapping
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
    @PostMapping(value = "/me/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadProfileImage(
            @Parameter(
                    description = "Imagen del perfil a cargar",
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            ) @RequestParam("file") MultipartFile file) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long userId = (Long) authentication.getPrincipal();
            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException(userId));

            if (user.getImgUrl() != null) {
                fileUploadService.deleteFile(user.getImgUrl());
            }

            String imgUrl = fileUploadService.saveFile(file, user.getEmail());
            user.setImgUrl(imgUrl);

            userRepository.save(user);
            return ResponseEntity.ok(imgUrl);
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
    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadUserImageById(
            @PathVariable Long id,
            @Parameter(
                    description = "Imagen del usuario a cargar",
                    content = @Content(
                            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")
                    )
            ) @RequestParam("file") MultipartFile file) {
        try {
            UserEntity user = userRepository.findById(id)
                    .orElseThrow(() -> new UserNotFoundException(id));

            if (user.getImgUrl() != null) {
                fileUploadService.deleteFile(user.getImgUrl());
            }

            String imgUrl = fileUploadService.saveFile(file, user.getEmail());
            user.setImgUrl(imgUrl);

            userRepository.save(user);
            return ResponseEntity.ok(imgUrl);
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
    public List<ManagedInventoryResponse> getManagedInventoriesByUserId(@PathVariable Long userId) {
        return getManagedInventoriesUseCase.getManagedInventories(userId);
    }

    @PostMapping("/changePassword")
    public ChangePasswordResponse changePassword(@RequestBody @Valid ChangePasswordRequest changePasswordRequest) {
        return changePasswordUseCase.changePassword(changePasswordRequest);
    }

    @PostMapping("/changePasswordToUser")
    public ChangePasswordResponse changePasswordToUser(@RequestBody @Valid ChangePasswordToUserRequest changePasswordRequest) {
        return changePasswordToUserUseCase.changePasswordToUser(changePasswordRequest);
    }

    @Operation(
            summary = "Get users by current user's institution",
            description = "Retrieves all users from the current user's institution with pagination, excluding SUPERADMIN and ADMIN_REGIONAL roles"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(schema = @Schema(implementation = PagedUserResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @ApiResponse(responseCode = "404", description = "Current user or institution not found")
    @GetMapping("/institution")
    public PagedUserResponse getUsersByInstitution(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "6") int size) {
        UserEntity currentUser = authService.getCurrentUser();
        
        if (currentUser.getInstitution() == null) {
            throw new ResourceNotFoundException("Current user does not have an institution assigned");
        }
        
        Pageable pageable = PageRequest.of(page, size);
        org.springframework.data.domain.Page<UserEntity> userPage = userRepository.findByInstitutionExcludingRoles(
                currentUser.getInstitution(),
                Role.SUPERADMIN,
                Role.ADMIN_REGIONAL,
                pageable
        );
        
        List<UserResponse> userResponses = userPage.getContent()
                .stream()
                .map(UserMapper::toResponse)
                .toList();
        
        return PagedUserResponse.builder()
                .users(userResponses)
                .currentPage(userPage.getNumber())
                .totalPages(userPage.getTotalPages())
                .totalUsers(userPage.getTotalElements())
                .pageSize(userPage.getSize())
                .first(userPage.isFirst())
                .last(userPage.isLast())
                .build();
    }

    @Operation(
            summary = "Get user statistics",
            description = "Retrieves total statistics of users by role (Superadmin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = UserStatisticsResponse.class))
    )
    @ApiResponse(responseCode = "403", description = "Access denied - SUPERADMIN role required")
    @PreAuthorize("hasRole('SUPERADMIN')")
    @GetMapping("/statistics")
    public UserStatisticsResponse getUserStatistics() {
        long totalUsers = userRepository.count();
        long superadminCount = userRepository.countByRole(Role.SUPERADMIN);
        long adminInstitutionCount = userRepository.countByRole(Role.ADMIN_INSTITUTION);
        long adminRegionalCount = userRepository.countByRole(Role.ADMIN_REGIONAL);
        long warehouseCount = userRepository.countByRole(Role.WAREHOUSE);
        long userCount = userRepository.countByRole(Role.USER);

        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .superadminCount(superadminCount)
                .adminInstitutionCount(adminInstitutionCount)
                .adminRegionalCount(adminRegionalCount)
                .warehouseCount(warehouseCount)
                .userCount(userCount)
                .build();
    }

    @Operation(
            summary = "Get my loans",
            description = "Retrieves all items that have been lent to the currently authenticated user"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Loans retrieved successfully",
            content = @Content(schema = @Schema(implementation = LoanResponse.class))
    )
    @ApiResponse(responseCode = "401", description = "Not authenticated")
    @GetMapping("/me/loans")
    public ResponseEntity<List<LoanResponse>> getMyLoans() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (Long) authentication.getPrincipal();
        List<LoanResponse> loans = getMyLoansUseCase.getMyLoans(userId);
        return ResponseEntity.ok(loans);
    }

    @Operation(
            summary = "Get user loans by ID",
            description = "Retrieves all items that have been lent to a specific user (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Loans retrieved successfully",
            content = @Content(schema = @Schema(implementation = LoanResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @GetMapping("/{userId}/loans")
    public ResponseEntity<List<LoanResponse>> getUserLoans(@PathVariable Long userId) {
        List<LoanResponse> loans = getMyLoansUseCase.getMyLoans(userId);
        return ResponseEntity.ok(loans);
    }

    @Operation(
            summary = "Get user owned inventories",
            description = "Retrieves all inventories owned by a specific user (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Owned inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = com.sgdis.backend.inventory.application.dto.InventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @Transactional(readOnly = true)
    @GetMapping("/{userId}/inventories/owner")
    public ResponseEntity<List<InventoryResponse>> getUserOwnedInventories(@PathVariable Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        List<InventoryEntity> inventories = 
                userRepository.findInventoriesByOwnerId(userId);
        
        List<InventoryResponse> responses = inventories.stream()
                .map(InventoryMapper::toResponse)
                .toList();
        
        return ResponseEntity.ok(responses);
    }

    @Operation(
            summary = "Get user signatory inventories",
            description = "Retrieves all inventories where a specific user is a signatory (Admin only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Signatory inventories retrieved successfully",
            content = @Content(schema = @Schema(implementation = InventoryResponse.class))
    )
    @ApiResponse(responseCode = "404", description = "User not found")
    @ApiResponse(responseCode = "403", description = "Access denied")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN_INSTITUTION')")
    @Transactional(readOnly = true)
    @GetMapping("/{userId}/inventories/signatory")
    public ResponseEntity<List<InventoryResponse>> getUserSignatoryInventories(@PathVariable Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        
        // Force initialization of lazy collection within transaction
        List<InventoryEntity> inventories = user.getMySignatories();
        if (inventories == null) {
            inventories = List.of();
        } else {
            // Initialize the collection to avoid LazyInitializationException
            inventories.size();
        }
        
        List<InventoryResponse> responses = inventories.stream()
                .map(InventoryMapper::toResponse)
                .toList();
        
        return ResponseEntity.ok(responses);
    }
}
