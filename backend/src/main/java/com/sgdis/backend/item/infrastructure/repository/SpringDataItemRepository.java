package com.sgdis.backend.item.infrastructure.repository;

import com.sgdis.backend.item.domain.Attribute;
import com.sgdis.backend.item.infrastructure.entity.ItemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpringDataItemRepository extends JpaRepository<ItemEntity, Long> {

    @Query("SELECT i FROM ItemEntity i WHERE i.inventory.id = :inventoryId")
    Page<ItemEntity> findByInventoryId(@Param("inventoryId") Long inventoryId, Pageable pageable);

    @Query("SELECT i FROM ItemEntity i WHERE i.inventory.id = :inventoryId AND i.category.id = :categoryId")
    Page<ItemEntity> findByInventoryIdAndCategoryId(@Param("inventoryId") Long inventoryId, @Param("categoryId") Long categoryId, Pageable pageable);

    Optional<ItemEntity> findByLicencePlateNumber(String licencePlateNumber);

    @Query("SELECT DISTINCT i FROM ItemEntity i, IN(i.attributes) a WHERE KEY(a) = :attributeKey AND VALUE(a) = :attributeValue")
    Optional<ItemEntity> findByAttribute(@Param("attributeKey") Attribute attributeKey, @Param("attributeValue") String attributeValue);

    @Query("SELECT i FROM ItemEntity i WHERE i.inventory.id = :inventoryId")
    List<ItemEntity> findAllByInventoryId(@Param("inventoryId") Long inventoryId);
}