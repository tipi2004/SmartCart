package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.request.UpdateShopRequest;
import com.smartcart.dto.response.OrderResponse;
import com.smartcart.dto.response.ProductResponse;
import com.smartcart.dto.response.ShopResponse;
import com.smartcart.service.ShopService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/shops")
@Tag(name = "7. Shop (Gian hang)", description = "Quan ly gian hang cua nguoi ban")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @Operation(summary = "Xem shop cua minh", security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<ShopResponse>> getMyShop(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(shopService.getMyShop(principal.getName())));
    }

    @Operation(summary = "Cap nhat ten shop", security = @SecurityRequirement(name = "Bearer Authentication"))
    @PutMapping("/my")
    public ResponseEntity<ApiResponse<ShopResponse>> updateMyShop(
            @RequestBody UpdateShopRequest request, Principal principal) {
        ShopResponse updated = shopService.updateMyShop(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Cap nhat shop thanh cong.", updated));
    }

    @Operation(summary = "Xem tat ca san pham cua shop minh", security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/my/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getMyProducts(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(shopService.getMyProducts(principal.getName())));
    }

    @Operation(summary = "Xem don hang cua shop minh", security = @SecurityRequirement(name = "Bearer Authentication"))
    @GetMapping("/my/orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(shopService.getMyOrders(principal.getName())));
    }

    @Operation(summary = "Xem thong tin 1 shop")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopResponse>> getShopById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(shopService.getShopById(id)));
    }

    @Operation(summary = "Xem san pham cua 1 shop")
    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getShopProducts(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(shopService.getShopProducts(id)));
    }
}
