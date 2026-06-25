package com.smartcart.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "shops")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// THÊM DÒNG NÀY ĐỂ TRÁNH LỖI PROXY 500
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // ID của người chủ gian hàng (Sinh viên/Người bán)
    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug; 

    @Column(nullable = false)
    @Builder.Default
    private String status = "pending";

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private Boolean isVerified = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
