package com.sgdis.backend.institution.infrastructure.repository;

import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataInstitutionRepository extends JpaRepository<InstitutionEntity,Long>{

}
