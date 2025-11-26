package com.sgdis.backend.auditory.infrastructure.repository;

import com.sgdis.backend.auditory.infrastructure.entity.AuditoryEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataAuditoryRepository extends JpaRepository<AuditoryEntity,Long> {
    Page<AuditoryEntity> findAllByOrderByDateDesc(Pageable pageable);
}
