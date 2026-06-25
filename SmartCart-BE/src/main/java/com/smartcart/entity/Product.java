package com.smartcart.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // ID của gian hàng (Có thể là gian hàng của 1 bạn sinh viên, hoặc 1 CLB trong trường)
    @Column(name = "shop_id", nullable = false)
    private UUID shopId; 

    // Liên kết: Sản phẩm này thuộc Danh mục nào?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String name; // VD: "Pass lại Combo sách Toán Cao Cấp 1, 2"

    @Column(nullable = false)
    private String slug; // VD: combo-sach-toan-cao-cap

    @Column(columnDefinition = "TEXT")
    private String description; // Chi tiết tình trạng: "Sách mới 90%, có highlight vài chỗ quan trọng..."

    @Column(name = "base_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal basePrice; // Giá bán (Dùng BigDecimal để tính tiền không bị sai số)

    @Column(name = "stock_quantity", nullable = false, columnDefinition = "integer default 100")
    @Builder.Default
    private Integer stockQuantity = 100;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true; // Trạng thái: Đang bán (true) hay đã chốt đơn/xóa (false)

    @Column(name = "approval_status")
    @Builder.Default
    private String approvalStatus = "pending"; // pending / approved / rejected

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // Tự động gán thời gian hiện tại khi đăng sản phẩm mới
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.stockQuantity == null) {
            this.stockQuantity = 100;
        }
    }
    // THÊM BIẾN NÀY ĐỂ LƯU LINK ẢNH TỪ CLOUDINARY
    @Column(name = "image_url")
    private String imageUrl;
}
