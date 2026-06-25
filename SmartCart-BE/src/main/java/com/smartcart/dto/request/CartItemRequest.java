package com.smartcart.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public class CartItemRequest {
    @NotNull(message = "Product id khong duoc de trong.")
    private UUID productId;

    @NotNull(message = "So luong khong duoc de trong.")
    @Min(value = 1, message = "So luong phai lon hon 0.")
    private Integer quantity;

    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
