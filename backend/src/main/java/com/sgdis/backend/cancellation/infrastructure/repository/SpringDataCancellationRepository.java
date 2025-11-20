package com.sgdis.backend.cancellation.infrastructure.repository;

import com.sgdis.backend.cancellation.infrastructure.entity.CancellationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataCancellationRepository extends JpaRepository<CancellationEntity, Long> {}