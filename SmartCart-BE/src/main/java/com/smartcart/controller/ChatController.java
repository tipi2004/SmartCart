package com.smartcart.controller;

import com.smartcart.dto.ApiResponse;
import com.smartcart.dto.request.ChatRequest;
import com.smartcart.dto.response.ChatMessageResponse;
import com.smartcart.dto.response.ChatResponse;
import com.smartcart.service.ChatbotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@Tag(name = "9. Chatbot", description = "Chatbot ho tro sinh vien tim kiem va mua hang")
public class ChatController {

    private final ChatbotService chatbotService;

    public ChatController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @Operation(summary = "Gui tin nhan cho chatbot", description = "Chatbot se tra loi dua tren danh sach san pham hien co.")
    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> chat(
            @RequestBody ChatRequest request, Principal principal) {
        ChatResponse response = chatbotService.chat(principal != null ? principal.getName() : null, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(summary = "Lay lich su chat")
    @SecurityRequirement(name = "Bearer Authentication")
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getHistory(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success(chatbotService.getHistory(principal.getName())));
    }

    @Operation(summary = "Xoa toan bo lich su chat")
    @SecurityRequirement(name = "Bearer Authentication")
    @DeleteMapping("/history")
    public ResponseEntity<ApiResponse<String>> clearHistory(Principal principal) {
        chatbotService.clearHistory(principal.getName());
        return ResponseEntity.ok(ApiResponse.success("Da xoa lich su chat."));
    }
}
