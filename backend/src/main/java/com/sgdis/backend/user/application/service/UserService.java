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
}
