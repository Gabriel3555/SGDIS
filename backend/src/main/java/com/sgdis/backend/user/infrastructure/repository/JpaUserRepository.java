package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.data.regional.RegionalEntity;
import com.sgdis.backend.data.regional.repositories.SpringDataRegionalRepository;
import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.dto.AssignRegionalRequest;
import com.sgdis.backend.user.application.dto.UserRegionalDto;
import com.sgdis.backend.user.application.port.out.*;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.mapper.UserMapper;
import com.sgdis.backend.inventory.mapper.InventoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
        AssignRegionalRepository{

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
            throw new ResourceNotFoundException("No user found with id " + id);
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
                .orElseThrow(()->new ResourceNotFoundException("No user found with id " + id));
    }

    @Override
    public User findUserByEmail(String email) {
        return repository.findByEmail(email)
                .map(UserMapper::toDomain)
                .orElseThrow(()->new ResourceNotFoundException("No user found with email " + email));
    }

    @Override
    public List<com.sgdis.backend.inventory.domain.Inventory> findManagedInventoriesByUserId(Long userId) {
        if (!repository.existsById(userId)) {
            throw new ResourceNotFoundException("No user found with id " + userId);
        }
        return repository.findManagedInventoriesByUserId(userId).stream()
                .map(InventoryMapper::toDomain)
                .toList();
    }

    @Override
    public UserRegionalDto assignRegional(AssignRegionalRequest request) {
        Optional<UserEntity> userEntity = repository.findById(request.userId());
        Optional<RegionalEntity> regionalEntity = regionalRepository.findById(request.regionalId());

        userEntity.ifPresent(userEntity1 -> {
            regionalEntity.ifPresent(regionalEntity1 -> {

                //User side
                List<RegionalEntity> regionalEntities = userEntity1.getRegionals();
                regionalEntities.add(regionalEntity1);
                userEntity1.setRegionals(regionalEntities);
                regionalRepository.save(regionalEntity1);

                //Regionals side
                List<UserEntity> userEntities = regionalEntity1.getUsers();
                userEntities.add(userEntity1);
                regionalEntity1.setUsers(userEntities);
                regionalRepository.save(regionalEntity1);
            });
        });

        UserEntity savedUser = repository.findById(request.userId()).orElseThrow();
        RegionalEntity savedRegional = regionalRepository.findById(request.regionalId()).orElseThrow();

        return new UserRegionalDto(savedUser, savedRegional);
    }
}
