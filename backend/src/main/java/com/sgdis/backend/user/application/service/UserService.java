package com.sgdis.backend.user.application.service;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
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
        AssignRegionalUseCase,
        GetUserByIdUseCase,
        CreateUserUseCase,
        UpdateUserUseCase,
        DeleteUserUseCase {

    private final SpringDataUserRepository userRepository;
    private final SpringDataRegionalRepository regionalRepository;
    private final PasswordEncoder passwordEncoder;

    // Política de email permitido
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
        // 1) Validar dominio del email
        if (!isAllowedEmail(createUserRequest.email())) {
            throw new InvalidEmailDomainException(createUserRequest.email());
        }

        // 2) Verificar que el email no exista
        if (userRepository.findByEmail(createUserRequest.email()).isPresent()) {
            throw new EmailAlreadyInUseException(createUserRequest.email());
        }

        // 3) Mapear a entidad, hashear password, persistir
        UserEntity user = UserMapper.fromCreateRequest(createUserRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        UserEntity saved = userRepository.save(user);
        return UserMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest updateUserRequest) {
        // 0) Obtener el ID del usuario autenticado
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long currentUserId = (Long) authentication.getPrincipal();
        
        // 0.1) Cargar usuario actual para preservar campos
        UserEntity existingUser = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        
        // 0.2) Validar que el usuario no pueda desactivar su propio estado
        if (currentUserId.equals(id) && updateUserRequest.status() != null && !updateUserRequest.status()) {
            throw new DomainValidationException("No puedes desactivar tu propio estado de usuario");
        }

        // 1) Si viene email en el request y cambia, validar dominio y unicidad
        if (updateUserRequest.email() != null) {
            String newEmail = updateUserRequest.email();
            String oldEmail = existingUser.getEmail();

            if (!newEmail.equalsIgnoreCase(oldEmail)) {
                // 1.a) Dominio permitido
                if (!isAllowedEmail(newEmail)) {
                    throw new InvalidEmailDomainException(newEmail);
                }
                // 1.b) Unicidad (si otro usuario ya lo usa)
                userRepository.findByEmail(newEmail).ifPresent(other -> {
                    if (!other.getId().equals(id)) {
                        throw new EmailAlreadyInUseException(newEmail);
                    }
                });
            }
        }

        // 2) Mapear cambios y preservar campos existentes
        UserEntity user = UserMapper.fromUpdateRequest(updateUserRequest, id);

        // 2.a) Password: mantener si no viene, o hashear si sí
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            user.setPassword(existingUser.getPassword());
        } else {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        if (user.getImgUrl() == null) user.setImgUrl(existingUser.getImgUrl());
        if (user.getJobTitle() == null) user.setJobTitle(existingUser.getJobTitle());
        if (user.getLaborDepartment() == null) user.setLaborDepartment(existingUser.getLaborDepartment());

        // 3) Persistir
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
    @Transactional
    public AssignRegionalResponse assignRegional(AssignRegionalRequest request) {
        UserEntity user = userRepository.findById(request.userId())
                .orElseThrow(() -> new UserNotFoundException(request.userId()));

        RegionalEntity regional = regionalRepository.findById(request.regionalId())
                .orElseThrow(() -> new RegionalNotFoundException(request.regionalId()));

        boolean alreadyAssigned = user.getRegionals().stream()
                .anyMatch(r -> r.getId().equals(regional.getId()));
        if (alreadyAssigned) {
            throw new UserAlreadyAssignedToRegionalException(request.userId(), request.regionalId());
        }

        // Mantener consistencia en memoria (bidireccional)
        user.getRegionals().add(regional);
        regional.getUsers().add(user);

        // Guardar el lado propietario de la relación
        userRepository.save(user);

        return new AssignRegionalResponse(
                "Succesfull regional assigned",
                user.getFullName()
        );
    }
}
