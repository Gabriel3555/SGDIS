package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.user.application.port.out.GetUserByIdRepository;
import com.sgdis.backend.user.domain.User;
import com.sgdis.backend.user.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JpaUserRepository implements GetUserByIdRepository {

    private final SpringDataUserRepository repository;

    @Override
    public Optional<User> findById(Long id) {
        return repository.findById(id).stream().map(UserMapper::toDomain).findFirst();
    }
}
