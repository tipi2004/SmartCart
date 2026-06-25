package com.smartcart.dto.response;

import com.smartcart.entity.Shop;
import com.smartcart.entity.User;
import java.time.LocalDateTime;
import java.util.UUID;

public class ShopResponse {
    private final UUID id;
    private final UUID ownerId;
    private final String name;
    private final String slug;
    private final String status;
    private final Boolean isVerified;
    private final String ownerName;
    private final String ownerEmail;
    private final String ownerPhone;
    private final LocalDateTime createdAt;

    private ShopResponse(Shop shop, User owner) {
        this.id = shop.getId();
        this.ownerId = shop.getOwnerId();
        this.name = shop.getName();
        this.slug = shop.getSlug();
        this.status = shop.getStatus();
        this.isVerified = shop.getIsVerified();
        this.ownerName = owner != null ? owner.getFullName() : null;
        this.ownerEmail = owner != null ? owner.getEmail() : null;
        this.ownerPhone = owner != null ? owner.getPhone() : null;
        this.createdAt = shop.getCreatedAt();
    }

    public static ShopResponse from(Shop shop) { return new ShopResponse(shop, null); }
    public static ShopResponse from(Shop shop, User owner) { return new ShopResponse(shop, owner); }

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getStatus() { return status; }
    public Boolean getIsVerified() { return isVerified; }
    public String getOwnerName() { return ownerName; }
    public String getOwnerEmail() { return ownerEmail; }
    public String getOwnerPhone() { return ownerPhone; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
