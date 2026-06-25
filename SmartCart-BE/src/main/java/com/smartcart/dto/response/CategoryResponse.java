package com.smartcart.dto.response;

import com.smartcart.entity.Category;
import java.util.UUID;

public class CategoryResponse {
    private final UUID id;
    private final String name;
    private final String slug;
    private final String imageUrl;
    private final Integer displayOrder;
    private final UUID parentId;

    private CategoryResponse(Category category) {
        this.id = category.getId();
        this.name = category.getName();
        this.slug = category.getSlug();
        this.imageUrl = category.getImageUrl();
        this.displayOrder = category.getDisplayOrder();
        this.parentId = category.getParent() != null ? category.getParent().getId() : null;
    }

    public static CategoryResponse from(Category category) { return new CategoryResponse(category); }
    public UUID getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getImageUrl() { return imageUrl; }
    public Integer getDisplayOrder() { return displayOrder; }
    public UUID getParentId() { return parentId; }
}