package com.smartcart.dto.response;

import com.smartcart.entity.ChatMessage;
import java.time.LocalDateTime;
import java.util.UUID;

public class ChatMessageResponse {
    private final UUID id;
    private final String role;
    private final String content;
    private final LocalDateTime createdAt;

    private ChatMessageResponse(ChatMessage msg) {
        this.id = msg.getId();
        this.role = msg.getRole();
        this.content = msg.getContent();
        this.createdAt = msg.getCreatedAt();
    }

    public static ChatMessageResponse from(ChatMessage msg) { return new ChatMessageResponse(msg); }

    public UUID getId() { return id; }
    public String getRole() { return role; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}