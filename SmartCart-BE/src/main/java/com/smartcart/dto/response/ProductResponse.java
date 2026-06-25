package com.smartcart.dto.response;

import com.smartcart.entity.Product;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public class ProductResponse {
    private final UUID id;
    private final UUID shopId;
    private final String categoryName;
    private final String name;
    private final String slug;
    private final String description;
    private final BigDecimal basePrice;
    private final Integer stockQuantity;
    private final String imageUrl;
    private final Boolean isActive;
    private final String approvalStatus;
    private final String rejectionReason;
    private final LocalDateTime createdAt;

    private ProductResponse(Product product) {
        this.id = product.getId();
        this.shopId = product.getShopId();
        this.categoryName = product.getCategory() != null ? product.getCategory().getName() : null;
        this.name = product.getName();
        this.slug = product.getSlug();
        this.description = product.getDescription();
        this.basePrice = product.getBasePrice();
        this.stockQuantity = product.getStockQuantity();
        this.imageUrl = product.getImageUrl();
        this.isActive = product.getIsActive();
        this.approvalStatus = product.getApprovalStatus() == null ? "approved" : product.getApprovalStatus();
        this.rejectionReason = product.getRejectionReason();
        this.createdAt = product.getCreatedAt();
    }

    public static ProductResponse from(Product product) { return new ProductResponse(product); }
    public UUID getId() { return id; }
    public UUID getShopId() { return shopId; }
    public String getCategoryName() { return categoryName; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getDescription() { return description; }
    public BigDecimal getBasePrice() { return basePrice; }
    public Integer getStockQuantity() { return stockQuantity; }
    public String getImageUrl() { return imageUrl; }
    public Boolean getIsActive() { return isActive; }
    public String getApprovalStatus() { return approvalStatus; }
    public String getRejectionReason() { return rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
