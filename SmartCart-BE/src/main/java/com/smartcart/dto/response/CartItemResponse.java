package com.smartcart.dto.response;

import com.smartcart.entity.CartItem;
import java.math.BigDecimal;
import java.util.UUID;

public class CartItemResponse {
    private final UUID id;
    private final UUID productId;
    private final String productName;
    private final String productImageUrl;
    private final BigDecimal unitPrice;
    private final Integer quantity;
    private final BigDecimal subtotal;

    private CartItemResponse(CartItem item) {
        this.id = item.getId();
        this.productId = item.getProduct().getId();
        this.productName = item.getProduct().getName();
        this.productImageUrl = item.getProduct().getImageUrl();
        this.unitPrice = item.getProduct().getBasePrice();
        this.quantity = item.getQuantity();
        this.subtotal = item.getProduct().getBasePrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }

    public static CartItemResponse from(CartItem item) { return new CartItemResponse(item); }

    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public String getProductName() { return productName; }
    public String getProductImageUrl() { return productImageUrl; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getSubtotal() { return subtotal; }
}