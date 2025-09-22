package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.exception.ResourceNotFoundException;
import com.sgdis.backend.user.application.port.out.*;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class JpaUserRepository implements
        CreateUserRepository,
        UpdateUserRepository,
        DeleteUserRepository,
        ListUserRepository,
        GetUserByIdRepository,
        GetUserByEmailRepository  {

    private final SpringDataUserRepository repository;

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
}
