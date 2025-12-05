package com.sgdis.backend.user.infrastructure.repository;

import com.sgdis.backend.institution.infrastructure.entity.InstitutionEntity;
import com.sgdis.backend.inventory.infrastructure.entity.InventoryEntity;
import com.sgdis.backend.user.domain.Role;
import com.sgdis.backend.user.infrastructure.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SpringDataUserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmail(String email);

    @Query("SELECT i FROM InventoryEntity i JOIN i.managers m WHERE m.id = :userId")
    List<InventoryEntity> findManagedInventoriesByUserId(Long userId);

    @Query("SELECT i FROM InventoryEntity i WHERE i.owner.id = :userId")
    List<InventoryEntity> findInventoriesByOwnerId(Long userId);
    
    @Query("SELECT u FROM UserEntity u WHERE u.institution = :institution AND u.role != :role1 AND u.role != :role2")
    List<UserEntity> findByInstitutionExcludingRoles(
            @Param("institution") InstitutionEntity institution,
            @Param("role1") Role role1,
            @Param("role2") Role role2
    );
    
    @Query("SELECT u FROM UserEntity u WHERE u.institution = :institution AND u.role != :role1 AND u.role != :role2 ORDER BY u.id DESC")
    org.springframework.data.domain.Page<UserEntity> findByInstitutionExcludingRoles(
            @Param("institution") InstitutionEntity institution,
            @Param("role1") Role role1,
            @Param("role2") Role role2,
            org.springframework.data.domain.Pageable pageable
    );
    
    @Query("SELECT u FROM UserEntity u WHERE u.institution.regional.id = :regionalId AND u.role != :excludedRole AND u.id != :currentUserId ORDER BY u.id DESC")
    org.springframework.data.domain.Page<UserEntity> findByRegionalExcludingRoleAndCurrentUser(
            @Param("regionalId") Long regionalId,
            @Param("excludedRole") Role excludedRole,
            @Param("currentUserId") Long currentUserId,
            org.springframework.data.domain.Pageable pageable
    );
    
    long countByRole(Role role);
    
    long count();
    
    // Regional statistics queries
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.institution.regional.id = :regionalId AND u.role != :excludedRole")
    long countByRegionalIdExcludingRole(@Param("regionalId") Long regionalId, @Param("excludedRole") Role excludedRole);
    
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.institution.regional.id = :regionalId AND u.role = :role")
    long countByRegionalIdAndRole(@Param("regionalId") Long regionalId, @Param("role") Role role);
    
    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.institution WHERE u.id = :userId")
    Optional<UserEntity> findByIdWithInstitution(@Param("userId") Long userId);
    
    // Institution statistics queries
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.institution.id = :institutionId AND u.role != :excludedRole")
    long countByInstitutionIdExcludingRole(@Param("institutionId") Long institutionId, @Param("excludedRole") Role excludedRole);
    
    @Query("SELECT COUNT(u) FROM UserEntity u WHERE u.institution.id = :institutionId AND u.role = :role")
    long countByInstitutionIdAndRole(@Param("institutionId") Long institutionId, @Param("role") Role role);
    
    // Queries para notificaciones de items
    @Query("SELECT u FROM UserEntity u WHERE u.role = :role AND u.status = true")
    List<UserEntity> findByRoleAndStatus(@Param("role") Role role);
    
    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.institution inst LEFT JOIN FETCH inst.regional " +
           "WHERE u.role = :role AND u.status = true AND inst.regional.id = :regionalId")
    List<UserEntity> findByRoleAndRegionalId(@Param("role") Role role, @Param("regionalId") Long regionalId);
    
    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.institution " +
           "WHERE u.status = true AND u.institution.id = :institutionId " +
           "AND (u.role = :role1 OR u.role = :role2)")
    List<UserEntity> findByInstitutionIdAndRoles(@Param("institutionId") Long institutionId, 
                                                 @Param("role1") Role role1, 
                                                 @Param("role2") Role role2);
    
    @Query("SELECT u FROM UserEntity u LEFT JOIN FETCH u.institution " +
           "WHERE u.status = true AND u.institution.id = :institutionId AND u.role = :role")
    List<UserEntity> findByInstitutionIdAndRole(@Param("institutionId") Long institutionId, 
                                                 @Param("role") Role role);
}