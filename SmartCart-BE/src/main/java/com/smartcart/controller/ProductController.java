package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.ProductRequest;
import com.smartcart.dto.request.UpdateProductRequest;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.exception.BusinessException;
import com.smartcart.service.FileUploadService;
import com.smartcart.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Tag(name = "3. Product (San pham)", description = "Cho sinh vien: Cac API lien quan den hang hoa")
public class ProductController {

    private final ProductService productService;
    private final FileUploadService fileUploadService;

    public ProductController(ProductService productService, FileUploadService fileUploadService) {
        this.productService = productService;
        this.fileUploadService = fileUploadService;
    }

    @Operation(summary = "Xem / Tim kiem san pham", description = "Ho tro filter theo categoryId va keyword. Neu khong truyen tham so thi lay tat ca.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String keyword) {
        List<ProductResponse> products = (categoryId == null && (keyword == null || keyword.isBlank()))
                ? productService.getAllActiveProducts()
                : productService.searchProducts(categoryId, keyword);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @Operation(summary = "Xem chi tiet 1 san pham")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @Operation(summary = "Dang ban san pham (Co kem anh)")
    @PreAuthorize("isAuthenticated()")
    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<String>> createProduct(
            @RequestParam("name") String name,
            @RequestParam("description") String description,
            @RequestParam("price") BigDecimal price,
            @RequestParam("categoryId") UUID categoryId,
            @RequestParam(value = "stockQuantity", required = false) Integer stockQuantity,
            @RequestParam(value = "imageUrl", required = false) String imageUrlParam,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            Principal principal) {

        String imageUrl = imageUrlParam != null && !imageUrlParam.isBlank() ? imageUrlParam.trim() : null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                imageUrl = fileUploadService.uploadFile(imageFile);
            } catch (Exception e) {
                throw new BusinessException("Loi upload anh: " + e.getMessage());
            }
        }

        ProductRequest request = new ProductRequest();
        request.setName(name);
        request.setDescription(description);
        request.setPrice(price);
        request.setCategoryId(categoryId);
        request.setStockQuantity(stockQuantity);

        String message = productService.createProduct(request, imageUrl, principal.getName());
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @Operation(summary = "Cap nhat san pham", description = "Chi chu shop moi duoc cap nhat. Truyen field nao thi update field do.")
    @PreAuthorize("isAuthenticated()")
    @PutMapping("/{id}")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request,
            Principal principal) {
        ProductResponse updated = productService.updateProduct(id, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Cap nhat thanh cong.", updated));
    }

    @Operation(summary = "Cap nhat san pham co upload anh", description = "Chi chu shop moi duoc cap nhat. Dung multipart khi can thay anh.")
    @PreAuthorize("isAuthenticated()")
    @PutMapping(value = "/{id}/multipart", consumes = {"multipart/form-data"})
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductMultipart(
            @PathVariable UUID id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "price", required = false) BigDecimal price,
            @RequestParam(value = "categoryId", required = false) UUID categoryId,
            @RequestParam(value = "stockQuantity", required = false) Integer stockQuantity,
            @RequestParam(value = "imageUrl", required = false) String imageUrlParam,
            @RequestParam(value = "imageFile", required = false) MultipartFile imageFile,
            Principal principal) {

        String imageUrl = imageUrlParam != null && !imageUrlParam.isBlank() ? imageUrlParam.trim() : null;
        if (imageFile != null && !imageFile.isEmpty()) {
            try {
                imageUrl = fileUploadService.uploadFile(imageFile);
            } catch (Exception e) {
                throw new BusinessException("Loi upload anh: " + e.getMessage());
            }
        }

        UpdateProductRequest request = new UpdateProductRequest();
        request.setName(name);
        request.setDescription(description);
        request.setPrice(price);
        request.setCategoryId(categoryId);
        request.setStockQuantity(stockQuantity);
        request.setImageUrl(imageUrl);

        ProductResponse updated = productService.updateProduct(id, request, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Cap nhat thanh cong.", updated));
    }

    @Operation(summary = "An san pham (soft delete)", description = "Chi chu shop moi duoc xoa. San pham se bi an khoi danh sach.")
    @PreAuthorize("isAuthenticated()")
    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "Bearer Authentication")
    public ResponseEntity<ApiResponse<String>> deleteProduct(
            @PathVariable UUID id, Principal principal) {
        productService.deleteProduct(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.success("San pham da duoc an thanh cong."));
    }
}
