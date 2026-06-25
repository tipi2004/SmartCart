package com.smartcart.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mailFrom;
    private final String backendUrl;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from}") String mailFrom,
                        @Value("${app.backend-url}") String backendUrl) {
        this.mailSender = mailSender;
        this.mailFrom = mailFrom;
        this.backendUrl = backendUrl;
    }

    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            helper.setFrom(new InternetAddress(mailFrom, "SmartCart"));
            
            helper.setTo(toEmail);
            helper.setSubject("Mã xác nhận đăng ký tài khoản SmartCart");

            // Template HTML được thiết kế đẹp hơn
            String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;\">"
                    
                    // Phần Header (Đã tăng kích thước logo max-height: 130px)
                    + "<div style=\"text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;\">"
                    + "<img src=\"https://i.ibb.co/4HtRkf9/logo.jpg\" alt=\"SmartCart Logo\" style=\"max-height: 130px; width: auto; object-fit: contain;\" />"
                    + "<p style=\"color: #777; margin-top: 5px;\">Nền tảng mua sắm thông minh</p>"
                    + "</div>"
                    
                    // Phần Nội dung chính
                    + "<div style=\"padding: 20px 0;\">"
                    + "<h2 style=\"color: #333;\">Xin chào,</h2>"
                    + "<p style=\"color: #555; line-height: 1.6; font-size: 16px;\">"
                    + "Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại <b>SmartCart</b>. "
                    + "Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác nhận dưới đây:"
                    + "</p>"
                    
                    // Khung chứa Mã OTP nổi bật (Đổi màu nền thành màu cam/san hô #ff7043)
                    + "<div style=\"text-align: center; margin: 30px 0;\">"
                    + "<span style=\"display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ffffff; background-color: #ff7043; padding: 15px 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);\">"
                    + otpCode 
                    + "</span>"
                    + "</div>"
                    
                    + "<p style=\"color: #555; line-height: 1.6; font-size: 16px;\">"
                    + "Mã xác nhận này sẽ hết hạn trong vòng <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai để đảm bảo an toàn cho tài khoản của bạn."
                    + "</p>"
                    + "</div>"
                    
                    // Phần Footer
                    + "<div style=\"text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0;\">"
                    + "<p style=\"color: #999; font-size: 12px; margin: 0;\">Trân trọng,</p>"
                    + "<p style=\"color: #999; font-size: 14px; font-weight: bold; margin: 5px 0;\">Đội ngũ SmartCart</p>"
                    + "<p style=\"color: #bbb; font-size: 11px;\">© 2026 SmartCart Inc. Mọi quyền được bảo lưu.</p>"
                    + "</div>"
                    
                    + "</div>";

            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException e) {
            throw new RuntimeException("Lỗi khi gửi email: " + e.getMessage());
        }
    }
    public void sendVerificationLink(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            helper.setFrom(new InternetAddress(mailFrom, "SmartCart"));
            helper.setTo(toEmail);
            helper.setSubject("Kích hoạt tài khoản SmartCart");

            // Tạo đường link xác thực trỏ về Backend
            String verifyLink = backendUrl + "/api/auth/verify?token=" + token;

            String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;\">"
                    + "<div style=\"text-align: center; padding-bottom: 20px;\">"
                    + "<img src=\"https://i.ibb.co/4HtRkf9/logo.jpg\" alt=\"SmartCart\" style=\"max-height: 100px;\" />"
                    + "</div>"
                    + "<h2 style=\"color: #333;\">Chào mừng bạn đến với SmartCart!</h2>"
                    + "<p style=\"color: #555; line-height: 1.6;\">Bạn vừa tạo một tài khoản mới. Vui lòng bấm vào nút bên dưới để xác thực địa chỉ email và kích hoạt tài khoản của bạn:</p>"
                    + "<div style=\"text-align: center; margin: 30px 0;\">"
                    + "<a href=\"" + verifyLink + "\" style=\"display: inline-block; padding: 15px 30px; font-size: 16px; font-weight: bold; color: #fff; background-color: #ff7043; text-decoration: none; border-radius: 5px;\">Kích Hoạt Tài Khoản</a>"
                    + "</div>"
                    + "<p style=\"color: #999; font-size: 14px;\">Link này sẽ hết hạn trong vòng 15 phút. Nếu nút bấm không hoạt động, bạn có thể copy đường link sau dán vào trình duyệt: <br> <a href=\"" + verifyLink + "\">" + verifyLink + "</a></p>"
                    + "</div>";

            helper.setText(content, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        }
    }
    public void sendResetPasswordLink(String toEmail, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "utf-8");

            helper.setFrom(new InternetAddress(mailFrom, "SmartCart"));
            helper.setTo(toEmail);
            helper.setSubject("Yêu cầu đặt lại mật khẩu SmartCart");

            // Tạo đường link xác thực cho Quên Mật Khẩu
            String resetLink = backendUrl + "/api/auth/verify-reset-email?token=" + token;

            String content = "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;\">"
                    + "<div style=\"text-align: center; padding-bottom: 20px;\">"
                    + "<img src=\"https://i.ibb.co/4HtRkf9/logo.jpg\" alt=\"SmartCart\" style=\"max-height: 100px;\" />"
                    + "</div>"
                    + "<h2 style=\"color: #333;\">Yêu cầu Đặt Lại Mật Khẩu</h2>"
                    + "<p style=\"color: #555; line-height: 1.6;\">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng bấm vào nút bên dưới để xác nhận đổi mật khẩu mới:</p>"
                    + "<div style=\"text-align: center; margin: 30px 0;\">"
                    + "<a href=\"" + resetLink + "\" style=\"display: inline-block; padding: 15px 30px; font-size: 16px; font-weight: bold; color: #fff; background-color: #e53935; text-decoration: none; border-radius: 5px;\">Xác Nhận Đổi Mật Khẩu</a>"
                    + "</div>"
                    + "<p style=\"color: #999; font-size: 14px;\">Link này sẽ hết hạn trong vòng 15 phút. Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>"
                    + "</div>";

            helper.setText(content, true);
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi gửi email: " + e.getMessage());
        }
    }
}   
