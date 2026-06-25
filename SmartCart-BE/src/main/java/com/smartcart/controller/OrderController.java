package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.request.CreateOrderRequest;
import com.smartcart.dto.request.PaymentWebhookRequest;
import com.smartcart.dto.response.OrderResponse;
import com.smartcart.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@Tag(name = "8. Order (Don hang)", description = "Quan ly don hang")
@SecurityRequirement(name = "Bearer Authentication")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Tao don hang tu gio hang hien tai")
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody CreateOrderRequest request, Principal principal) {
        OrderResponse order = orderService.createOrder(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Dat hang thanh cong.", order));
    }

    @Operation(summary = "Xem lich su don hang cua minh")
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getMyOrders(principal.getName())));
    }

    @Operation(summary = "Xem chi tiet 1 don hang")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(orderService.getOrderById(principal.getName(), id)));
    }

    @Operation(summary = "Tra cuu don hang tu ma QR", description = "Buyer, admin hoac seller co san pham trong don moi co quyen xem.")
    @GetMapping("/lookup/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> lookupOrder(
            @PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(orderService.lookupOrder(principal.getName(), id)));
    }

    @Operation(summary = "Huy don hang", description = "Chi huy duoc khi trang thai la pending.")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @PathVariable UUID id, Principal principal) {
        OrderResponse order = orderService.cancelOrder(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Don hang da duoc huy.", order));
    }

    @Operation(summary = "Xac nhan don hang", description = "Chuyen trang thai tu pending sang confirmed.")
    @PutMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmOrder(
            @PathVariable UUID id, Principal principal) {
        OrderResponse order = orderService.confirmOrder(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Don hang da duoc xac nhan.", order));
    }

    @Operation(summary = "Xac nhan thanh toan thu cong", description = "Admin/seller xac nhan don QR/chuyen khoan da thanh toan.")
    @PutMapping("/{id}/confirm-payment")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmPayment(
            @PathVariable UUID id, Principal principal) {
        OrderResponse order = orderService.confirmPaymentManually(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Thanh toan da duoc xac nhan.", order));
    }

    @Operation(summary = "Webhook xac nhan thanh toan", description = "Endpoint khung de gateway ngan hang/vi dien tu goi khi giao dich thanh cong.")
    @PostMapping("/payment-webhook")
    public ResponseEntity<ApiResponse<OrderResponse>> paymentWebhook(@RequestBody PaymentWebhookRequest request) {
        OrderResponse order = orderService.confirmPaymentFromWebhook(request);
        return ResponseEntity.ok(ApiResponse.success("Thanh toan da duoc xac nhan.", order));
    }
}
