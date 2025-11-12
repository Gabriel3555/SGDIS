package com.sgdis.backend.user.application.service;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.institution.infrastructure.repository.SpringDataInstitutionRepository;
import com.sgdis.backend.user.application.dto.*;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
// Excepciones
import com.sgdis.backend.exception.DomainValidationException;
import com.sgdis.backend.exception.userExceptions.InvalidEmailDomainException;
import com.sgdis.backend.exception.userExceptions.EmailAlreadyInUseException;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.exception.userExceptions.RegionalNotFoundException;
import com.sgdis.backend.exception.userExceptions.UserAlreadyAssignedToRegionalException;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final PasswordEncoder passwordEncoder;

    private static final Pattern ALLOWED_EMAIL =
            Pattern.compile("^[A-Za-z0-9._%+-]+@(soy\\.sena\\.edu\\.co|sena\\.edu\\.co)$");

    private static boolean isAllowedEmail(String email) {
        return email != null && ALLOWED_EMAIL.matcher(email).matches();
    }

    @Override
    public UserResponse getUserById(Long id) {
        UserEntity user = userRepository.findById(id)
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
    @Transactional
    public UserResponse createUser(CreateUserRequest createUserRequest) {
        if (!isAllowedEmail(createUserRequest.email())) {
            throw new InvalidEmailDomainException(createUserRequest.email());
        }

        if (userRepository.findByEmail(createUserRequest.email()).isPresent()) {
            throw new EmailAlreadyInUseException(createUserRequest.email());
        }

        InstitutionEntity institution = institutionRepository.getReferenceById(createUserRequest.institutionId());

        UserEntity user = UserMapper.fromCreateRequest(createUserRequest);
        user.setInstitution(institution);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        List<UserEntity> users = institution.getUsers();
        users.add(user);
        institution.setUsers(users);
        institutionRepository.save(institution);

        UserEntity saved = userRepository.save(user);
        return UserMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest updateUserRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) authentication.getPrincipal();

        UserEntity existingUser = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
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

        UserEntity user = UserMapper.fromUpdateRequest(updateUserRequest, id);

        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(existingUser.getPassword());
        } else {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        if (user.getImgUrl() == null) user.setImgUrl(existingUser.getImgUrl());
        if (user.getJobTitle() == null) user.setJobTitle(existingUser.getJobTitle());
        if (user.getLaborDepartment() == null) user.setLaborDepartment(existingUser.getLaborDepartment());

        UserEntity updated = userRepository.save(user);
        return UserMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public UserResponse deleteUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        userRepository.deleteById(id);
        return UserMapper.toResponse(user);
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
        return new ChangePasswordResponse("Password changed successfully",userEntity.getFullName());
    }
}
