package com.smartcart.service;

import com.smartcart.entity.Order;
import com.smartcart.entity.User;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    public EmailNotificationService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // Gui email xac nhan don hang cho buyer
    @Async
    public void sendOrderConfirmationToBuyer(User buyer, Order order) {
        String subject = "[SmartCart] Dat hang thanh cong - Don hang #" + order.getId().toString().substring(0, 8).toUpperCase();

        StringBuilder body = new StringBuilder();
        body.append("Xin chao ").append(buyer.getFullName()).append(",\n\n");
        body.append("Don hang cua ban da duoc dat thanh cong!\n\n");
        body.append("Ma don hang : #").append(order.getId().toString().substring(0, 8).toUpperCase()).append("\n");
        body.append("Trang thai  : Cho xac nhan\n");
        body.append("Tong tien   : ").append(String.format("%,.0f", order.getTotalAmount())).append(" VND\n");

        if (order.getNote() != null && !order.getNote().isBlank()) {
            body.append("Ghi chu     : ").append(order.getNote()).append("\n");
        }

        body.append("\nChi tiet san pham:\n");
        if (order.getItems() != null) {
            order.getItems().forEach(item ->
                body.append("  - ").append(item.getProductName())
                    .append(" x").append(item.getQuantity())
                    .append(" = ").append(String.format("%,.0f", item.getSubtotal())).append(" VND\n")
            );
        }

        body.append("\nCam on ban da mua sam tai SmartCart!\n");
        body.append("Chung toi se thong bao khi don hang duoc xac nhan.\n");

        sendEmail(buyer.getEmail(), subject, body.toString());
    }

    // Gui email thong bao don hang moi cho seller
    @Async
    public void sendNewOrderNotificationToSellers(Order order, List<User> sellers) {
        String subject = "[SmartCart] Ban co don hang moi - #" + order.getId().toString().substring(0, 8).toUpperCase();

        StringBuilder body = new StringBuilder();
        body.append("Xin chao,\n\n");
        body.append("Co mot don hang moi vua duoc dat cho san pham cua ban!\n\n");
        body.append("Ma don hang : #").append(order.getId().toString().substring(0, 8).toUpperCase()).append("\n");
        body.append("Trang thai  : Cho xac nhan\n");
        body.append("Tong tien   : ").append(String.format("%,.0f", order.getTotalAmount())).append(" VND\n");

        body.append("\nSan pham trong don hang:\n");
        if (order.getItems() != null) {
            order.getItems().forEach(item ->
                body.append("  - ").append(item.getProductName())
                    .append(" x").append(item.getQuantity())
                    .append(" = ").append(String.format("%,.0f", item.getSubtotal())).append(" VND\n")
            );
        }

        body.append("\nVui long dang nhap SmartCart de xac nhan don hang.\n");

        sellers.forEach(seller -> sendEmail(seller.getEmail(), subject, body.toString()));
    }

    // Gui email khi don hang duoc xac nhan (cho buyer)
    @Async
    public void sendOrderConfirmedToBuyer(User buyer, Order order) {
        String subject = "[SmartCart] Don hang da duoc xac nhan - #" + order.getId().toString().substring(0, 8).toUpperCase();

        StringBuilder body = new StringBuilder();
        body.append("Xin chao ").append(buyer.getFullName()).append(",\n\n");
        body.append("Don hang cua ban da duoc nguoi ban xac nhan!\n\n");
        body.append("Ma don hang : #").append(order.getId().toString().substring(0, 8).toUpperCase()).append("\n");
        body.append("Trang thai  : Da xac nhan\n");
        body.append("Tong tien   : ").append(String.format("%,.0f", order.getTotalAmount())).append(" VND\n");
        body.append("\nCam on ban da tin tuong SmartCart!\n");

        sendEmail(buyer.getEmail(), subject, body.toString());
    }

    // Gui email khi don hang bi huy (cho buyer)
    @Async
    public void sendOrderCancelledToBuyer(User buyer, Order order) {
        String subject = "[SmartCart] Don hang da bi huy - #" + order.getId().toString().substring(0, 8).toUpperCase();

        StringBuilder body = new StringBuilder();
        body.append("Xin chao ").append(buyer.getFullName()).append(",\n\n");
        body.append("Don hang cua ban da bi huy.\n\n");
        body.append("Ma don hang : #").append(order.getId().toString().substring(0, 8).toUpperCase()).append("\n");
        body.append("Trang thai  : Da huy\n");
        body.append("Tong tien   : ").append(String.format("%,.0f", order.getTotalAmount())).append(" VND\n");
        body.append("\nNeu ban co thac mac, vui long lien he ho tro SmartCart.\n");

        sendEmail(buyer.getEmail(), subject, body.toString());
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // Log loi nhung khong throw de khong anh huong luong chinh
            System.err.println("Loi gui email toi " + to + ": " + e.getMessage());
        }
    }
}
