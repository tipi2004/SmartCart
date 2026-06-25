const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const productsDir = path.join(process.cwd(), "public", "images", "products");

async function main() {
  const files = fs.readdirSync(productsDir).filter((file) => file.endsWith(".png"));

  for (const file of files) {
    const input = path.join(productsDir, file);
    const output = path.join(productsDir, file.replace(/\.png$/, ".webp"));

    await sharp(input)
      .rotate()
      .resize({
        width: 600,
        height: 600,
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .webp({ quality: 78, effort: 6 })
      .toFile(output);
  }

  console.log(`Optimized ${files.length} product images to WebP.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
