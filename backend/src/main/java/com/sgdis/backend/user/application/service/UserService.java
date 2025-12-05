package com.sgdis.backend.user.application.service;

import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.user.application.dto.*;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
// Excepciones
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.exception.userExceptions.InvalidEmailDomainException;
import com.sgdis.backend.exception.userExceptions.EmailAlreadyInUseException;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.exception.userExceptions.UserHasAssignedInventoriesException;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
// Auditoría
import com.sgdis.backend.auditory.application.port.in.RecordActionUseCase;
import com.sgdis.backend.auditory.application.dto.RecordActionRequest;
// Regional
import com.sgdis.backend.data.regional.entity.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
// Auth
import com.sgdis.backend.auth.application.service.AuthService;
// Notificaciones
import com.sgdis.backend.notification.service.NotificationService;
import com.sgdis.backend.notification.service.NotificationPersistenceService;
import com.sgdis.backend.notification.dto.NotificationMessage;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements
        ListUserUseCase,
        GetUserByIdUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
        DeleteUserUseCase,
        ChangePasswordUseCase,
        ChangePasswordToUserUseCase
{

    private final SpringDataUserRepository userRepository;
    private final SpringDataInstitutionRepository  institutionRepository;
    private final SpringDataRegionalRepository regionalRepository;
    private final PasswordEncoder passwordEncoder;
    private final RecordActionUseCase recordActionUseCase;
    private final AuthService authService;
    private final NotificationService notificationService;
    private final NotificationPersistenceService notificationPersistenceService;

    private static final Pattern ALLOWED_EMAIL =
            Pattern.compile("^[A-Za-z0-9._%+-]+@(soy\\.sena\\.edu\\.co|sena\\.edu\\.co)$");

    private static boolean isAllowedEmail(String email) {
        return email != null && ALLOWED_EMAIL.matcher(email).matches();
    }

    /**
     * Sincroniza la relación bidireccional User <-> Institution
     */
    private void syncUserInstitutionRelation(UserEntity user, InstitutionEntity institution) {
        if (user == null || institution == null) {
            return;
        }
        
        // Establecer la relación en User
        user.setInstitution(institution);
        
        // Sincronizar la relación en Institution
        List<UserEntity> users = institution.getUsers();
        if (users == null) {
            users = new ArrayList<>();
            institution.setUsers(users);
        }
        if (!users.contains(user)) {
            users.add(user);
        }
    }

    /**
     * Sincroniza la relación bidireccional Institution <-> Regional
     */
    private void syncInstitutionRegionalRelation(InstitutionEntity institution) {
        if (institution == null || institution.getRegional() == null) {
            return;
        }
        
        RegionalEntity regional = institution.getRegional();
        
        // Sincronizar la relación en Regional
        List<InstitutionEntity> institutions = regional.getInstitutions();
        if (institutions == null) {
            institutions = new ArrayList<>();
            regional.setInstitutions(institutions);
        }
        if (!institutions.contains(institution)) {
            institutions.add(institution);
        }
    }

    @Override
    public UserResponse getUserById(Long id) {
        UserEntity user = userRepository.findByIdWithInstitution(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        return UserMapper.toResponse(user);
    }

    @Override
    public List<UserResponse> listUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PagedUserResponse listUsers(Pageable pageable) {
        Page<UserEntity> userPage = userRepository.findAll(pageable);
        
        List<UserResponse> userResponses = userPage.getContent()
                .stream()
                .map(UserMapper::toResponse)
                .collect(Collectors.toList());

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

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest createUserRequest) {
        if (!isAllowedEmail(createUserRequest.email())) {
            throw new InvalidEmailDomainException(createUserRequest.email());
        }

        if (userRepository.findByEmail(createUserRequest.email()).isPresent()) {
            throw new EmailAlreadyInUseException(createUserRequest.email());
        }

        // Validar que institutionId no sea null
        if (createUserRequest.institutionId() == null) {
            throw new DomainValidationException("La institución es obligatoria para crear un usuario");
        }

        InstitutionEntity institution = institutionRepository.findById(createUserRequest.institutionId())
                .orElseThrow(() -> new ResourceNotFoundException("Institution not found with id: " + createUserRequest.institutionId()));

        // Validate that ADMIN_REGIONAL can only create users in their own regional
        try {
            UserEntity currentUser = authService.getCurrentUser();
            if (currentUser.getRole() == Role.ADMIN_REGIONAL) {
                if (currentUser.getInstitution() == null || currentUser.getInstitution().getRegional() == null) {
                    throw new DomainValidationException("El administrador regional no tiene una institución o regional asignada");
                }
                
                Long currentUserRegionalId = currentUser.getInstitution().getRegional().getId();
                Long institutionRegionalId = institution.getRegional() != null ? institution.getRegional().getId() : null;
                
                if (institutionRegionalId == null || !institutionRegionalId.equals(currentUserRegionalId)) {
                    throw new DomainValidationException("Un administrador regional solo puede crear usuarios en su propia regional");
                }
            }
        } catch (RuntimeException e) {
            // If getCurrentUser fails (e.g., user not authenticated), allow the request to proceed
            // This is handled by Spring Security's @PreAuthorize annotations
            // Only validate if we can get the current user
        }

        UserEntity user = UserMapper.fromCreateRequest(createUserRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // Sincronizar relaciones bidireccionales
        syncUserInstitutionRelation(user, institution);
        syncInstitutionRegionalRelation(institution);

        // Guardar las entidades (JPA propagará los cambios)
        if (institution.getRegional() != null) {
            regionalRepository.save(institution.getRegional());
        }
        institutionRepository.save(institution);
        UserEntity saved = userRepository.save(user);
        
        // Enviar notificaciones a usuarios relacionados
        sendUserCreatedNotifications(saved);
        
        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Usuario creado: %s (%s) - Rol: %s", saved.getFullName(), saved.getEmail(), saved.getRole())
        ));
        
        return UserMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest updateUserRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) authentication.getPrincipal();

        UserEntity existingUser = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        // Guardar valores originales para auditoría
        String originalFullName = existingUser.getFullName();
        String originalEmail = existingUser.getEmail();
        Role originalRole = existingUser.getRole();
        boolean originalStatus = existingUser.isStatus();
        String originalJobTitle = existingUser.getJobTitle();
        String originalLaborDepartment = existingUser.getLaborDepartment();
        String originalInstitutionName = existingUser.getInstitution() != null ? existingUser.getInstitution().getName() : null;
        
        if (currentUserId.equals(id) && updateUserRequest.status() != null && !updateUserRequest.status()) {
            throw new DomainValidationException("No puedes desactivar tu propio estado de usuario");
        }

        if (updateUserRequest.email() != null) {
            String newEmail = updateUserRequest.email();
            String oldEmail = existingUser.getEmail();

            if (!newEmail.equalsIgnoreCase(oldEmail)) {
                if (!isAllowedEmail(newEmail)) {
                    throw new InvalidEmailDomainException(newEmail);
                }
                userRepository.findByEmail(newEmail).ifPresent(other -> {
                    if (!other.getId().equals(id)) {
                        throw new EmailAlreadyInUseException(newEmail);
                    }
                });
            }
        }

        // Update existing user entity instead of creating a new one
        // This ensures the entity is managed by JPA and relationships are properly handled
        if (updateUserRequest.fullName() != null) {
            existingUser.setFullName(updateUserRequest.fullName());
        }
        if (updateUserRequest.email() != null) {
            existingUser.setEmail(updateUserRequest.email());
        }
        if (updateUserRequest.role() != null) {
            existingUser.setRole(Role.valueOf(updateUserRequest.role().toUpperCase()));
        }
        if (updateUserRequest.status() != null) {
            existingUser.setStatus(updateUserRequest.status());
        }
        if (updateUserRequest.jobTitle() != null) {
            existingUser.setJobTitle(updateUserRequest.jobTitle());
        }
        if (updateUserRequest.laborDepartment() != null) {
            existingUser.setLaborDepartment(updateUserRequest.laborDepartment());
        }

        // Handle institution update
        Long institutionIdValue = updateUserRequest.institutionId();
        
        if (institutionIdValue != null && institutionIdValue > 0) {
            try {
                InstitutionEntity newInstitution = institutionRepository.findById(institutionIdValue)
                        .orElseThrow(() -> new ResourceNotFoundException("Institution not found with id: " + institutionIdValue));
                
                // Si el usuario ya tenía una institución, removerlo de la lista anterior
                InstitutionEntity oldInstitution = existingUser.getInstitution();
                if (oldInstitution != null && !oldInstitution.getId().equals(newInstitution.getId())) {
                    List<UserEntity> oldUsers = oldInstitution.getUsers();
                    if (oldUsers != null) {
                        oldUsers.remove(existingUser);
                        institutionRepository.save(oldInstitution);
                    }
                }
                
                // Sincronizar relaciones bidireccionales con la nueva institución
                syncUserInstitutionRelation(existingUser, newInstitution);
                syncInstitutionRegionalRelation(newInstitution);
                
                // Guardar la nueva institución y su regional si existe
                if (newInstitution.getRegional() != null) {
                    regionalRepository.save(newInstitution.getRegional());
                }
                institutionRepository.save(newInstitution);
            } catch (ResourceNotFoundException e) {
                // If institution not found, keep existing institution (already set, no change needed)
            } catch (Exception e) {
                // Keep existing institution on error
            }
        }

        // Save and flush to ensure the institution relationship is persisted
        UserEntity updated = userRepository.save(existingUser);
        userRepository.flush(); // Force immediate database write
        
        // Reload to verify the institution was saved
        UserEntity reloaded = userRepository.findById(updated.getId()).orElse(updated);
        
        // Registrar auditoría - construir descripción de cambios usando valores originales
        StringBuilder changes = new StringBuilder();
        if (updateUserRequest.fullName() != null && !updateUserRequest.fullName().equals(originalFullName)) {
            changes.append("Nombre actualizado | ");
        }
        if (updateUserRequest.email() != null && !updateUserRequest.email().equalsIgnoreCase(originalEmail)) {
            changes.append("Email actualizado | ");
        }
        if (updateUserRequest.role() != null) {
            Role newRole = Role.valueOf(updateUserRequest.role().toUpperCase());
            if (!newRole.equals(originalRole)) {
                changes.append("Rol actualizado | ");
            }
        }
        if (updateUserRequest.status() != null && updateUserRequest.status() != originalStatus) {
            changes.append("Estado actualizado | ");
        }
        if (updateUserRequest.jobTitle() != null && (originalJobTitle == null || !updateUserRequest.jobTitle().equals(originalJobTitle))) {
            changes.append("Cargo actualizado | ");
        }
        if (updateUserRequest.laborDepartment() != null && (originalLaborDepartment == null || !updateUserRequest.laborDepartment().equals(originalLaborDepartment))) {
            changes.append("Departamento actualizado | ");
        }
        if (institutionIdValue != null && institutionIdValue > 0 && reloaded.getInstitution() != null) {
            String newInstitution = reloaded.getInstitution().getName();
            String oldInstitution = originalInstitutionName != null ? originalInstitutionName : "N/A";
            if (!newInstitution.equals(oldInstitution)) {
                changes.append("Institución actualizada | ");
            }
        }
        
        String changesDescription = changes.length() > 0 ? changes.toString().substring(0, changes.length() - 3) : "Sin cambios";
        
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Usuario actualizado: %s (%s) - %s", reloaded.getFullName(), reloaded.getEmail(), changesDescription)
        ));
        
        return UserMapper.toResponse(reloaded);
    }

    @Override
    @Transactional
    public UserResponse deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        // Verify user has no assigned inventories before deleting
        // Check both owned inventories and managed inventories
        List<InventoryEntity> ownedInventories = userRepository.findInventoriesByOwnerId(id);
        List<InventoryEntity> managedInventories = userRepository.findManagedInventoriesByUserId(id);
        
        int ownedCount = ownedInventories.size();
        int managedCount = managedInventories.size();
        int totalCount = ownedCount + managedCount;
        
        if (totalCount > 0) {
            if (ownedCount > 0 && managedCount > 0) {
                throw new UserHasAssignedInventoriesException(id, ownedCount, managedCount);
            } else {
                throw new UserHasAssignedInventoriesException(id, totalCount);
            }
        }
        
        try {
            String userEmail = user.getEmail();
            String userName = user.getFullName();
            
            // Enviar notificaciones antes de eliminar el usuario
            sendUserDeletedNotifications(user);
            
            userRepository.deleteById(id);
            
            // Registrar auditoría
            recordActionUseCase.recordAction(new RecordActionRequest(
                    String.format("Usuario eliminado: %s (%s)", userName, userEmail)
            ));
            
            return UserMapper.toResponse(user);
        } catch (Exception e) {
            // Catch any database constraint violations
            throw new UserHasAssignedInventoriesException(id, totalCount);
        }
    }


    @Override
    public ChangePasswordResponse changePassword(ChangePasswordRequest changePasswordRequest) {
        Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            throw new InvalidEmailDomainException(user.getEmail());
        }

        if (passwordEncoder.matches(changePasswordRequest.oldPassword(), user.getPassword())) {
            user.setPassword(passwordEncoder.encode(changePasswordRequest.newPassword()));
        }

        userRepository.save(user);
        return new ChangePasswordResponse("Password changed successfully",user.getFullName());
    }

    @Override
    public ChangePasswordResponse changePasswordToUser(ChangePasswordToUserRequest request) {
        UserEntity userEntity = userRepository.findById(request.id()).orElseThrow(() -> new UserNotFoundException(request.id()));
        userEntity.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(userEntity);
        
        // Registrar auditoría
        recordActionUseCase.recordAction(new RecordActionRequest(
                String.format("Contraseña restablecida: %s (%s)", userEntity.getFullName(), userEntity.getEmail())
        ));
        
        return new ChangePasswordResponse("Password changed successfully",userEntity.getFullName());
    }

    /**
     * Envía notificaciones a todos los usuarios relacionados cuando se crea un usuario.
     * Se notifica a:
     * - Todos los superadmin
     * - Todos los admin regional de la misma regional del usuario
     * - Todos los admin institution de la misma institution del usuario
     * 
     * No se envía notificación al usuario que realiza la acción ni al usuario creado.
     */
    private void sendUserCreatedNotifications(UserEntity user) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // 2. Admin regional de la misma regional del usuario
            if (user.getInstitution() != null && 
                user.getInstitution().getRegional() != null) {
                Long regionalId = user.getInstitution().getRegional().getId();
                
                List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // 3. Admin institution de la misma institution del usuario
            if (user.getInstitution() != null) {
                Long institutionId = user.getInstitution().getId();
                
                List<UserEntity> adminInstitutions = userRepository.findByInstitutionIdAndRole(institutionId, Role.ADMIN_INSTITUTION);
                adminInstitutions.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // Remover al usuario actual y al usuario creado de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            userIdsToNotify.remove(user.getId());
            
            // Preparar datos de la notificación
            String userName = user.getFullName() != null ? user.getFullName() : "Usuario sin nombre";
            String userEmail = user.getEmail() != null ? user.getEmail() : "Sin email";
            String userRole = user.getRole() != null ? user.getRole().name() : "Sin rol";
            String institutionName = user.getInstitution() != null && user.getInstitution().getName() != null
                    ? user.getInstitution().getName()
                    : "Sin institución";
            String message = String.format("Se ha creado un nuevo usuario: %s (%s) - Rol: %s - Institución: %s", 
                    userName, userEmail, userRole, institutionName);
            
            NotificationMessage notification = new NotificationMessage(
                    "USER_CREATED",
                    "Nuevo Usuario Creado",
                    message,
                    new UserNotificationData(user.getId(), userName, userEmail, userRole, institutionName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    // Guardar en base de datos
                    notificationPersistenceService.saveNotification(
                            userId,
                            "USER_CREATED",
                            "Nuevo Usuario Creado",
                            message,
                            new UserNotificationData(user.getId(), userName, userEmail, userRole, institutionName)
                    );
                    
                    // Enviar por WebSocket
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                    // El log se maneja en NotificationService
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la creación del usuario
            // El sistema de notificaciones no debe bloquear la creación
        }
    }

    /**
     * Envía notificaciones a todos los usuarios relacionados cuando se elimina un usuario.
     * Se notifica a:
     * - Todos los superadmin
     * - Todos los admin regional de la misma regional del usuario
     * - Todos los admin institution de la misma institution del usuario
     * 
     * No se envía notificación al usuario que realiza la acción.
     */
    private void sendUserDeletedNotifications(UserEntity user) {
        try {
            UserEntity currentUser = authService.getCurrentUser();
            Long currentUserId = currentUser.getId();
            
            // Usar un Set para evitar duplicados
            Set<Long> userIdsToNotify = new HashSet<>();
            
            // 1. Todos los superadmin
            List<UserEntity> superadmins = userRepository.findByRoleAndStatus(Role.SUPERADMIN);
            superadmins.forEach(admin -> userIdsToNotify.add(admin.getId()));
            
            // 2. Admin regional de la misma regional del usuario
            if (user.getInstitution() != null && 
                user.getInstitution().getRegional() != null) {
                Long regionalId = user.getInstitution().getRegional().getId();
                
                List<UserEntity> adminRegionals = userRepository.findByRoleAndRegionalId(Role.ADMIN_REGIONAL, regionalId);
                adminRegionals.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // 3. Admin institution de la misma institution del usuario
            if (user.getInstitution() != null) {
                Long institutionId = user.getInstitution().getId();
                
                List<UserEntity> adminInstitutions = userRepository.findByInstitutionIdAndRole(institutionId, Role.ADMIN_INSTITUTION);
                adminInstitutions.forEach(admin -> userIdsToNotify.add(admin.getId()));
            }
            
            // Remover al usuario actual de la lista de notificaciones
            userIdsToNotify.remove(currentUserId);
            
            // Preparar datos de la notificación
            String userName = user.getFullName() != null ? user.getFullName() : "Usuario sin nombre";
            String userEmail = user.getEmail() != null ? user.getEmail() : "Sin email";
            String userRole = user.getRole() != null ? user.getRole().name() : "Sin rol";
            String institutionName = user.getInstitution() != null && user.getInstitution().getName() != null
                    ? user.getInstitution().getName()
                    : "Sin institución";
            String message = String.format("Se ha eliminado el usuario: %s (%s) - Rol: %s - Institución: %s", 
                    userName, userEmail, userRole, institutionName);
            
            NotificationMessage notification = new NotificationMessage(
                    "USER_DELETED",
                    "Usuario Eliminado",
                    message,
                    new UserNotificationData(user.getId(), userName, userEmail, userRole, institutionName)
            );
            
            // Enviar notificaciones a todos los usuarios
            for (Long userId : userIdsToNotify) {
                try {
                    // Guardar en base de datos
                    notificationPersistenceService.saveNotification(
                            userId,
                            "USER_DELETED",
                            "Usuario Eliminado",
                            message,
                            new UserNotificationData(user.getId(), userName, userEmail, userRole, institutionName)
                    );
                    
                    // Enviar por WebSocket
                    notificationService.sendNotificationToUser(userId, notification);
                } catch (Exception e) {
                    // Log error pero continuar con otros usuarios
                    // El log se maneja en NotificationService
                }
            }
        } catch (Exception e) {
            // Log error pero no fallar la eliminación del usuario
            // El sistema de notificaciones no debe bloquear la eliminación
        }
    }
    
    /**
     * DTO interno para datos del usuario en la notificación
     */
    private record UserNotificationData(
            Long userId,
            String userName,
            String userEmail,
            String userRole,
            String institutionName
    ) {}
}
