package com.smartcart.dto.request;

import java.math.BigDecimal;
import java.util.UUID;

public class PaymentWebhookRequest {
    private UUID orderId;
    private BigDecimal amount;
    private String transactionId;
    private String status;

    public UUID getOrderId() { return orderId; }
    public void setOrderId(UUID orderId) { this.orderId = orderId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
