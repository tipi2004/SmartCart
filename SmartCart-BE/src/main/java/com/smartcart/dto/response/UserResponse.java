package com.smartcart.dto.response;

import com.smartcart.entity.User;
import java.time.ZonedDateTime;
import java.util.UUID;

public class UserResponse {
    private final UUID id;
    private final String fullName;
    private final String email;
    private final String phone;
    private final String shippingAddress;
    private final String role;
    private final Boolean isActive;
    private final ZonedDateTime createdAt;

    private UserResponse(User user) {
        this.id = user.getId();
        this.fullName = user.getFullName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.shippingAddress = user.getShippingAddress();
        this.role = user.getRole();
        this.isActive = user.getIsActive();
        this.createdAt = user.getCreatedAt();
    }

    public static UserResponse from(User user) { return new UserResponse(user); }
    public UUID getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getShippingAddress() { return shippingAddress; }
    public String getRole() { return role; }
    public Boolean getIsActive() { return isActive; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
}
