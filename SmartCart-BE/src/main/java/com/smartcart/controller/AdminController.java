package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.request.CategoryRequest;
import com.smartcart.dto.response.CategoryResponse;
import com.smartcart.dto.response.OrderResponse;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.dto.response.ShopResponse;
import com.smartcart.dto.response.UserResponse;
import com.smartcart.service.CategoryService;
import com.smartcart.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "10. Admin", description = "Quan tri vien - quan ly nguoi dung, san pham, don hang")
@SecurityRequirement(name = "Bearer Authentication")
@PreAuthorize("hasAuthority('admin')")
public class AdminController {

    private final AdminService adminService;
    private final CategoryService categoryService;

    public AdminController(AdminService adminService, CategoryService categoryService) {
        this.adminService = adminService;
        this.categoryService = categoryService;
    }

    // ========== USER ==========

    @Operation(summary = "Lay danh sach tat ca nguoi dung")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllUsers()));
    }

    @Operation(summary = "Cap nhat trang thai nguoi dung (kich hoat / khoa tai khoan)",
               description = "Truyen `isActive=true` de mo khoa, `isActive=false` de khoa.")
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable UUID id,
            @RequestParam Boolean isActive) {
        UserResponse user = adminService.updateUserStatus(id, isActive);
        String msg = Boolean.TRUE.equals(isActive) ? "Tai khoan da duoc kich hoat." : "Tai khoan da bi khoa.";
        return ResponseEntity.ok(ApiResponse.success(msg, user));
    }

    // ========== PRODUCT ==========

    @Operation(summary = "Lay danh sach tat ca san pham (ca active va inactive)")
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllProducts()));
    }

    @Operation(summary = "Cap nhat trang thai san pham (hien thi / an)",
               description = "Truyen `isActive=true` de hien thi, `isActive=false` de an san pham.")
    @PutMapping("/products/{id}/status")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductStatus(
            @PathVariable UUID id,
            @RequestParam Boolean isActive) {
        ProductResponse product = adminService.updateProductStatus(id, isActive);
        String msg = Boolean.TRUE.equals(isActive) ? "San pham da duoc hien thi." : "San pham da bi an.";
        return ResponseEntity.ok(ApiResponse.success(msg, product));
    }

    @Operation(summary = "Cap nhat trang thai duyet san pham",
               description = "approvalStatus nhan cac gia tri: pending, approved, rejected.")
    @PutMapping("/products/{id}/approval")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductApprovalStatus(
            @PathVariable UUID id,
            @RequestParam String approvalStatus,
            @RequestParam(required = false) String rejectionReason) {
        ProductResponse product = adminService.updateProductApprovalStatus(id, approvalStatus, rejectionReason);
        String msg = switch (product.getApprovalStatus()) {
            case "approved" -> "San pham da duoc duyet.";
            case "rejected" -> "San pham da bi tu choi.";
            default -> "San pham da chuyen ve cho duyet.";
        };
        return ResponseEntity.ok(ApiResponse.success(msg, product));
    }

    // ========== SHOP ==========

    @Operation(summary = "Lay danh sach tat ca shop")
    @GetMapping("/shops")
    public ResponseEntity<ApiResponse<List<ShopResponse>>> getAllShops() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllShops()));
    }

    @Operation(summary = "Cap nhat trang thai shop",
               description = "status nhan cac gia tri: pending, active, suspended.")
    @PutMapping("/shops/{id}/status")
    public ResponseEntity<ApiResponse<ShopResponse>> updateShopStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        ShopResponse shop = adminService.updateShopStatus(id, status);
        String msg = switch (shop.getStatus()) {
            case "active" -> "Shop da duoc duyet va kich hoat.";
            case "suspended" -> "Shop da bi khoa.";
            default -> "Shop da chuyen ve trang thai cho duyet.";
        };
        return ResponseEntity.ok(ApiResponse.success(msg, shop));
    }

    // ========== CATEGORY ==========

    @Operation(summary = "Lay danh sach tat ca danh muc cho admin")
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategoriesForAdmin()));
    }

    @Operation(summary = "Tao danh muc moi")
    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Danh muc da duoc tao.", categoryService.createCategory(request)));
    }

    @Operation(summary = "Cap nhat danh muc")
    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Danh muc da duoc cap nhat.", categoryService.updateCategory(id, request)));
    }

    @Operation(summary = "Xoa danh muc")
    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Danh muc da duoc xoa.", null));
    }

    // ========== ORDER ==========

    @Operation(summary = "Lay danh sach tat ca don hang")
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.success(adminService.getAllOrders()));
    }

    @Operation(summary = "Xem chi tiet 1 don hang bat ky")
    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(adminService.getOrderById(id)));
    }
}
