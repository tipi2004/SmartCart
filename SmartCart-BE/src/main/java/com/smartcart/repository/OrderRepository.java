package com.smartcart.repository;

import com.smartcart.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Order> findByStatusAndPaymentStatusAndPaymentExpiresAtBefore(
            String status,
            String paymentStatus,
            LocalDateTime paymentExpiresAt
    );

    @Query("select distinct o from Order o join o.items i where i.productId in :productIds order by o.createdAt desc")
    List<Order> findSellerOrdersByProductIds(@Param("productIds") List<UUID> productIds);
}
