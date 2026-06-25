package com.smartcart.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class ProductRequest {
    @NotBlank(message = "Ten san pham khong duoc de trong.")
    private String name;         // Tên món đồ (VD: Giày thể thao cũ)

    private String description;  // Mô tả (VD: Mới đi 2 lần, pass lẹ...)

    @NotNull(message = "Gia san pham khong duoc de trong.")
    @DecimalMin(value = "0.01", message = "Gia san pham phai lon hon 0.")
    private BigDecimal price;    // Giá bán

    @NotNull(message = "Danh muc khong duoc de trong.")
    private UUID categoryId;     // Thuộc danh mục nào

    @Min(value = 0, message = "So luong ton kho khong duoc am.")
    private Integer stockQuantity;

    private MultipartFile imageFile;
}
