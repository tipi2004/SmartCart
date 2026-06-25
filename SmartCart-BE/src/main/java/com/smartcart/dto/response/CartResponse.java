package com.smartcart.dto.response;

import com.smartcart.entity.Cart;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CartResponse {
    private final UUID id;
    private final List<CartItemResponse> items;
    private final int totalItems;
    private final BigDecimal totalAmount;

    private CartResponse(Cart cart) {
        this.id = cart.getId();
        this.items = cart.getItems() == null ? List.of() :
                cart.getItems().stream().map(CartItemResponse::from).toList();
        this.totalItems = this.items.stream().mapToInt(CartItemResponse::getQuantity).sum();
        this.totalAmount = this.items.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static CartResponse from(Cart cart) { return new CartResponse(cart); }

    public UUID getId() { return id; }
    public List<CartItemResponse> getItems() { return items; }
    public int getTotalItems() { return totalItems; }
    public BigDecimal getTotalAmount() { return totalAmount; }
}