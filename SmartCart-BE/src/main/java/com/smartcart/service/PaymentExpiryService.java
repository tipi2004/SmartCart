package com.smartcart.service;

import com.smartcart.entity.Order;
import com.smartcart.repository.ProductRepository;
import com.smartcart.repository.OrderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentExpiryService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public PaymentExpiryService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void cancelExpiredPendingPayments() {
        List<Order> expiredOrders = orderRepository.findByStatusAndPaymentStatusAndPaymentExpiresAtBefore(
                "pending",
                "processing",
                LocalDateTime.now()
        );

        expiredOrders.forEach(order -> {
            if (order.getItems() != null) {
                order.getItems().forEach(item -> productRepository.findById(item.getProductId()).ifPresent(product -> {
                    int currentStock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
                    product.setStockQuantity(currentStock + item.getQuantity());
                    if (product.getStockQuantity() > 0) {
                        product.setIsActive(true);
                    }
                    productRepository.save(product);
                }));
            }
            order.setStatus("cancelled");
            order.setPaymentStatus("failed");
        });

        if (!expiredOrders.isEmpty()) {
            orderRepository.saveAll(expiredOrders);
        }
    }
}
