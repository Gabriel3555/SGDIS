package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.exception.userExceptions.RegionalNotFoundException;
import com.sgdis.backend.exception.userExceptions.UserAlreadyAssignedToRegionalException;
import com.sgdis.backend.exception.userExceptions.UserNotFoundException;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import com.sgdis.backend.user.application.dto.AssignRegionalRequest;
import com.sgdis.backend.user.application.dto.UserRegionalDto;
import com.sgdis.backend.user.application.port.out.AssignRegionalRepository;
import com.sgdis.backend.user.application.port.out.CreateUserRepository;
import com.sgdis.backend.user.application.port.out.DeleteUserRepository;
import com.sgdis.backend.user.application.port.out.GetManagedInventoriesRepository;
import com.sgdis.backend.user.application.port.out.GetUserByEmailRepository;
import com.sgdis.backend.user.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.user.application.port.out.ListUserRepository;
import com.sgdis.backend.user.application.port.out.UpdateUserRepository;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.mapper.UserMapper;


// Infra de Regional
import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;

// Spring y utilidades
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class JpaUserRepository implements
        CreateUserRepository,
        UpdateUserRepository,
        DeleteUserRepository,
        ListUserRepository,
        GetUserByIdRepository,
        GetUserByEmailRepository,
        GetManagedInventoriesRepository,
        AssignRegionalRepository {

    private final SpringDataUserRepository repository;
    private final SpringDataRegionalRepository regionalRepository;

    @Override
    public User createUser(User user) {
        UserEntity entity = UserMapper.toEntity(user);
        return UserMapper.toDomain(repository.save(entity));
    }

    @Override
    public User updateUser(User user) {
        UserEntity entity = UserMapper.toEntity(user);
        return UserMapper.toDomain(repository.save(entity));
    }

    @Override
    public void deleteById(Long id) {
        if (!repository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        repository.deleteById(id);
    }

    @Override
    public List<User> findAll() {
        return repository.findAll().stream()
                .map(UserMapper::toDomain)
                .toList();
    }

    @Override
    public User findUserById(Long id) {
        return repository.findById(id)
                .map(UserMapper::toDomain)
                .orElseThrow(() -> new UserNotFoundException(id));
    }

    @Override
    public User findUserByEmail(String email) {
        return repository.findByEmail(email)
                .map(UserMapper::toDomain)
                .orElseThrow(() -> new UserNotFoundException(email));
    }

    @Override
    public List<com.sgdis.backend.inventory.domain.Inventory> findManagedInventoriesByUserId(Long userId) {
        if (!repository.existsById(userId)) {
            throw new UserNotFoundException(userId);
        }
        return repository.findManagedInventoriesByUserId(userId).stream()
                .map(InventoryMapper::toDomain)
                .toList();
    }

    /**
     * Asigna una regional a un usuario.
     * - Valida existencia de User y Regional (404 si no existen).
     * - Evita duplicados (409 si ya está asignado).
     * - Transacción para mantener consistencia en ambos lados de la relación.
     */
    @Override
    @Transactional
    public UserRegionalDto assignRegional(AssignRegionalRequest request) {
        UserEntity user = repository.findById(request.userId())
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

        // Guardar el lado propietario de la relación.
        // Ajusta si en tu mapeo @ManyToMany el propietario es RegionalEntity (en ese caso guarda regionalRepository.save(regional)).
        repository.save(user);

        return new UserRegionalDto(user, regional);
    }
}
