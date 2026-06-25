package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.request.CartItemRequest;
import com.smartcart.dto.response.CartResponse;
import com.smartcart.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/cart")
@Tag(name = "6. Cart (Gio hang)", description = "Quan ly gio hang cua nguoi dung")
@SecurityRequirement(name = "Bearer Authentication")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @Operation(summary = "Xem gio hang hien tai")
    @GetMapping
    public ResponseEntity<ApiResponse<CartResponse>> getCart(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(cartService.getCart(principal.getName())));
    }

    @Operation(summary = "Them san pham vao gio")
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartResponse>> addItem(@Valid @RequestBody CartItemRequest request, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(cartService.addItem(principal.getName(), request)));
    }

    @Operation(summary = "Cap nhat so luong item trong gio")
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> updateItem(@PathVariable UUID itemId, @Valid @RequestBody CartItemRequest request, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(cartService.updateItem(principal.getName(), itemId, request)));
    }

    @Operation(summary = "Xoa 1 item khoi gio")
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CartResponse>> removeItem(@PathVariable UUID itemId, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(cartService.removeItem(principal.getName(), itemId)));
    }

    @Operation(summary = "Xoa toan bo gio hang")
    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> clearCart(Principal principal) {
        cartService.clearCart(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Da xoa toan bo gio hang."));
    }
}
