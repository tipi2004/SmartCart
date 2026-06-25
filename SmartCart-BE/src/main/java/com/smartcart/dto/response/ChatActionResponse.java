package com.smartcart.dto.response;

public class ChatActionResponse {
    private final String label;
    private final String href;
    private final String type;

    public ChatActionResponse(String label, String href, String type) {
        this.label = label;
        this.href = href;
        this.type = type;
    }

    public String getLabel() {
        return label;
    }

    public String getHref() {
        return href;
    }

    public String getType() {
        return type;
    }
}
