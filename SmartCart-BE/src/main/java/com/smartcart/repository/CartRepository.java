package com.smartcart.repository;

import com.smartcart.entity.Cart;
import com.smartcart.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {
    // Tìm giỏ hàng theo Chủ nhân (User)
    Optional<Cart> findByUser(User user);
}