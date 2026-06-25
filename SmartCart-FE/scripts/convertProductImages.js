const path = require("path");
const sharp = require("sharp");

const inputDir = path.join(process.env.USERPROFILE, "Desktop", "img-product");
const outputDir = path.join(process.cwd(), "public", "images", "products");

const files = [
  ["Trà sữa size M.webp", "tra-sua-size-m.png"],
  ["Cà phê sữa đá.jpg", "ca-phe-sua-da.png"],
  ["Nước suối Lavie.jpg", "nuoc-suoi-lavie.png"],
  ["Bánh mì thịt trứng buổi sáng.jpg", "banh-mi-thit.png"],
  ["Cơm cuộn rong biển sinh viên.jpg", "com-cuon-rong-bien.png"],
  ["Mì ly ăn liền.jpg", "mi-ly-an-lien.png"],
  ["Snack khoai tây.jpg", "snack-khoai-tay.png"],
  ["Khăn giấy ướt mini.webp", "khan-giay-uot.png"],
  ["Khẩu trang y tế hộp 10 cái.jpg", "khau-trang-y-te-hop.png"],
  ["Set sticker trang trí laptop.webp", "set-sticker-laptop.png"],
  ["Móc khóa SmartCart cute.jpg", "moc-khoa-smartcart.png"],
  ["Gấu bông mini tặng bạn.jpg", "gau-bong-mini.png"],
  ["Bình nước SmartCart.jpg", "binh-nuoc-smartcart.png"],
  ["Túi tote canvas.jpg", "tui-tote-canvas.png"],
  ["Tai nghe Bluetooth cũ.jpg", "tai-nghe-bluetooth.png"],
  ["Sạc dự phòng 10000mAh.webp", "sac-du-phong-10000mah.png"],
  ["Chuột không dây.jpg", "chuot-khong-day.png"],
  ["Bút highlight pastel.jpg", "but-highlight-pastel.png"],
  ["Vở kẻ ngang 80 trang.jpg", "vo-ke-ngang-80-trang.png"],
  ["Máy tính Casio cũ.jpg", "may-tinh-casio-cu.png"],
  ["In tài liệu đen trắng 50 trang.jpg", "in-tai-lieu-den-trang.png"],
  ["Giáo trình Java cơ bản.jpg", "giao-trinh-java-co-ban.png"],
  ["Sách tiếng Anh A2.jpg", "sach-tieng-anh-a2.png"],
  ["Sách Kinh tế vi mô.jpg", "sach-kinh-te-vi-mo.png"],
  ["Đèn học LED để bàn.jpg", "den-hoc-led.png"],
  ["Quạt bàn Senko mini.jpg", "quat-ban-senko-mini.png"],
  ["Móc treo quần áo 10 cái.jpg", "moc-treo-quan-ao.png"],
  ["Bàn nhựa gấp gọn Duy Tân.jpg", "ban-nhua-gap-gon.png"],
  ["Ổ cắm điện 3 lỗ.jpg", "o-cam-dien-3-lo.png"],
  ["Hộp đựng đồ mini.jpg", "hop-dung-do-mini.png"],
];

async function main() {
  for (const [source, target] of files) {
    await sharp(path.join(inputDir, source))
      .rotate()
      .resize({
        width: 900,
        height: 900,
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png({ quality: 92, compressionLevel: 9 })
      .toFile(path.join(outputDir, target));
  }

  console.log(`Converted ${files.length} product images.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
