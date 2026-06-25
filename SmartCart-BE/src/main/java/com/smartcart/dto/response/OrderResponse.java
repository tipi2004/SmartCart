package com.smartcart.dto.response;

import com.smartcart.entity.Order;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class OrderResponse {
    private final UUID id;
    private final String status;
    private final BigDecimal totalAmount;
    private final BigDecimal shippingFee;
    private final String paymentMethod;
    private final String paymentStatus;
    private final LocalDateTime paymentExpiresAt;
    private final String note;
    private final String shippingAddress;
    private final List<OrderItemResponse> items;
    private final LocalDateTime createdAt;

    private OrderResponse(Order order) {
        this.id = order.getId();
        this.status = order.getStatus();
        this.totalAmount = order.getTotalAmount();
        this.shippingFee = order.getShippingFee();
        this.paymentMethod = order.getPaymentMethod();
        this.paymentStatus = order.getPaymentStatus();
        this.paymentExpiresAt = order.getPaymentExpiresAt();
        this.note = order.getNote();
        this.shippingAddress = order.getShippingAddress();
        this.items = order.getItems() == null ? List.of() :
                order.getItems().stream().map(OrderItemResponse::from).toList();
        this.createdAt = order.getCreatedAt();
    }

    private OrderResponse(Order order, Set<UUID> productIds) {
        this.id = order.getId();
        this.status = order.getStatus();
        this.shippingFee = order.getShippingFee();
        this.paymentMethod = order.getPaymentMethod();
        this.paymentStatus = order.getPaymentStatus();
        this.paymentExpiresAt = order.getPaymentExpiresAt();
        this.note = order.getNote();
        this.shippingAddress = order.getShippingAddress();
        this.items = order.getItems() == null ? List.of() :
                order.getItems().stream()
                        .filter(item -> productIds.contains(item.getProductId()))
                        .map(OrderItemResponse::from)
                        .toList();
        BigDecimal sellerSubtotal = this.items.stream()
                .map(OrderItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        this.totalAmount = sellerSubtotal.add(order.getShippingFee() == null ? BigDecimal.ZERO : order.getShippingFee());
        this.createdAt = order.getCreatedAt();
    }

    public static OrderResponse from(Order order) { return new OrderResponse(order); }
    public static OrderResponse fromSeller(Order order, Set<UUID> productIds) { return new OrderResponse(order, productIds); }

    public UUID getId() { return id; }
    public String getStatus() { return status; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public BigDecimal getShippingFee() { return shippingFee; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public LocalDateTime getPaymentExpiresAt() { return paymentExpiresAt; }
    public String getNote() { return note; }
    public String getShippingAddress() { return shippingAddress; }
    public List<OrderItemResponse> getItems() { return items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
