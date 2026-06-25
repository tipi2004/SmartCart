package com.smartcart.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class CreateOrderRequest {
    @NotBlank(message = "Địa chỉ giao hàng không được để trống.")
    private String shippingAddress;

    private BigDecimal shippingFee;
    private String paymentMethod;
    private String note;
    private List<UUID> selectedItemIds;

    public String getShippingAddress() { return shippingAddress; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public List<UUID> getSelectedItemIds() { return selectedItemIds; }
    public void setSelectedItemIds(List<UUID> selectedItemIds) { this.selectedItemIds = selectedItemIds; }
}
