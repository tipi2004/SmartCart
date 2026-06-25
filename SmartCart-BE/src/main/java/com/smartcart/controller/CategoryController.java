package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.response.CategoryResponse;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "5. Category (Danh muc)", description = "Cac API quan ly danh muc san pham")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @Operation(summary = "Lay danh sach tat ca danh muc goc")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getAllCategories()));
    }

    @Operation(summary = "Lay chi tiet 1 danh muc")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getCategoryById(id)));
    }

    @Operation(summary = "Lay san pham theo danh muc")
    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByCategory(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(categoryService.getProductsByCategory(id)));
    }
}