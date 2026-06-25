package com.smartcart.dto.response;

import java.util.List;

public class ChatResponse {
    private final String reply;
    private final List<ChatActionResponse> actions;

    public ChatResponse(String reply) {
        this(reply, List.of());
    }

    public ChatResponse(String reply, List<ChatActionResponse> actions) {
        this.reply = reply;
        this.actions = actions == null ? List.of() : actions;
    }

    public String getReply() { return reply; }
    public List<ChatActionResponse> getActions() { return actions; }
}
