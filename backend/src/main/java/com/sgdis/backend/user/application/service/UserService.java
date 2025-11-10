package com.sgdis.backend.user.application.service;

import com.sgdis.backend.user.application.dto.*;
import com.sgdis.backend.user.application.port.in.*;
import com.sgdis.backend.user.application.port.out.*;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.repository.SpringDataUserRepository;
import com.sgdis.backend.user.mapper.UserMapper;
// Excepciones
import com.sgdis.backend.exception.userExceptions.InvalidEmailDomainException;
import com.sgdis.backend.exception.userExceptions.EmailAlreadyInUseException;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;

import lombok.RequiredArgsConstructor;
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

    private final CreateUserRepository createUserRepository;
    private final UpdateUserRepository updateUserRepository;
    private final DeleteUserRepository deleteUserRepository;
    private final ListUserRepository listUserRepository;
    private final GetUserByIdRepository getUserByIdRepository;
    private final GetUserByEmailRepository getUserByEmailRepository;
    private final AssignRegionalRepository assignRegionalRepository;

    private final SpringDataUserRepository springDataUserRepository;

    private final PasswordEncoder passwordEncoder;

    // Política de email permitido
    private static final Pattern ALLOWED_EMAIL =
            Pattern.compile("^[A-Za-z0-9._%+-]+@(soy\\.sena\\.edu\\.co|sena\\.edu\\.co)$");

    private static boolean isAllowedEmail(String email) {
        return email != null && ALLOWED_EMAIL.matcher(email).matches();
    }

    @Override
    public UserResponse getUserById(Long id) {
        return UserMapper.toResponse(getUserByIdRepository.findUserById(id));
    }

    @Override
    public List<UserResponse> listUsers() {
        return listUserRepository.findAll()
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

        try {
            getUserByEmailRepository.findUserByEmail(createUserRequest.email());
            // Si no lanza UserNotFoundException, el email ya existe
            throw new EmailAlreadyInUseException(createUserRequest.email());
        } catch (UserNotFoundException ignore) {
            // OK: no existe y podemos continuar
        }

        // 3) Mapear a dominio, hashear password, persistir
        User user = UserMapper.toDomain(createUserRequest);
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        User saved = createUserRepository.createUser(user);
        return UserMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest updateUserRequest) {
        // 0) Cargar usuario actual para preservar campos
        User existingUser = getUserByIdRepository.findUserById(id);

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
                try {
                    User other = getUserByEmailRepository.findUserByEmail(newEmail);
                    if (!other.getId().equals(id)) {
                        throw new EmailAlreadyInUseException(newEmail);
                    }
                } catch (UserNotFoundException ignore) {
                    // OK: no existe otro con ese email
                }
            }
        }

        // 2) Mapear cambios y preservar campos existentes
        User user = UserMapper.toDomain(updateUserRequest, id);

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
        User updated = updateUserRepository.updateUser(user);
        return UserMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public UserResponse deleteUser(Long id) {
        User user = getUserByIdRepository.findUserById(id);
        deleteUserRepository.deleteById(id);
        return UserMapper.toResponse(user);
    }

    @Override
    @Transactional
    public AssignRegionalResponse assignRegional(AssignRegionalRequest request) {
        UserRegionalDto userRegionalDto = assignRegionalRepository.assignRegional(request);
        return new AssignRegionalResponse(
                "Succesfull regional assigned",
                userRegionalDto.user().getFullName()
        );
    }
}
