package com.smartcart.dto.response;

import com.smartcart.entity.OrderItem;
import java.math.BigDecimal;
import java.util.UUID;

public class OrderItemResponse {
    private final UUID id;
    private final UUID productId;
    private final String productName;
    private final BigDecimal priceAtOrder;
    private final Integer quantity;
    private final BigDecimal subtotal;

    private OrderItemResponse(OrderItem item) {
        this.id = item.getId();
        this.productId = item.getProductId();
        this.productName = item.getProductName();
        this.priceAtOrder = item.getPriceAtOrder();
        this.quantity = item.getQuantity();
        this.subtotal = item.getSubtotal();
    }

    public static OrderItemResponse from(OrderItem item) { return new OrderItemResponse(item); }

    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public String getProductName() { return productName; }
    public BigDecimal getPriceAtOrder() { return priceAtOrder; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getSubtotal() { return subtotal; }
}