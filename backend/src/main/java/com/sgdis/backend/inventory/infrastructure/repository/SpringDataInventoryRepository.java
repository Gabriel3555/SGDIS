package com.sgdis.backend.inventory.infrastructure.repository;

import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataInventoryRepository extends JpaRepository<InventoryEntity, Long> {
    List<InventoryEntity> findInventoryEntitiesByOwnerId(Long ownerId);
    Optional<InventoryEntity> findByNameAndOwner(String name, UserEntity owner);

    @Query("SELECT i FROM InventoryEntity i JOIN i.managers m WHERE m.id = :managerId")
    List<InventoryEntity> findInventoryEntitiesByManagerId(@Param("managerId") Long managerId);

    InventoryEntity findInventoryEntityByOwner(UserEntity owner);
}
