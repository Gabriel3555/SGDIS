package com.sgdis.backend.auth.infrastructure.repository;

import com.sgdis.backend.auth.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataUserRepository extends JpaRepository<UserEntity, Long> {}