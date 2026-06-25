package com.smartcart.repository;

import com.smartcart.entity.Cart;
import com.smartcart.entity.CartItem;
import com.smartcart.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    // Tìm xem món đồ này đã có trong giỏ của người này chưa (Để cộng dồn số lượng)
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
}