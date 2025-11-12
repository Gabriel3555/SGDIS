package com.sgdis.backend.data.regional.repositories;

import com.sgdis.backend.data.regional.entity.RegionalEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataRegionalRepository extends JpaRepository<RegionalEntity, Long> {

}
