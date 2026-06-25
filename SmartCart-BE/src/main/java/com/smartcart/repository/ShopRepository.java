package com.smartcart.repository;

import com.smartcart.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ShopRepository extends JpaRepository<Shop, UUID> {
    Optional<Shop> findByOwnerId(UUID ownerId);

    List<Shop> findAllByOrderByCreatedAtDesc();

    boolean existsByIdAndStatus(UUID id, String status);
}
