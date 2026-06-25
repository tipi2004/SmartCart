package com.smartcart.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// THÊM DÒNG NÀY ĐỂ TRÁNH LỖI PROXY 500
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) 
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    // Liên kết tự chỉ: Danh mục con trỏ tới Danh mục cha
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnore // Chặn Jackson dịch danh mục cha để tránh rắc rối
    private Category parent;

    @Column(nullable = false)
    private String name; 

    @Column(nullable = false, unique = true)
    private String slug; 

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0; 
}