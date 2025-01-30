const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.uid : "unknown";
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${userId}-${uniqueSuffix}`);
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 } 
});

async function resizeIfNeeded(filePath) {
  const metadata = await sharp(filePath).metadata();
  if (metadata.width > 1000 || metadata.height > 1000) {
    await sharp(filePath)
      .resize(1000, 1000, { fit: "inside" })
      .toFile(filePath);
  }
}

module.exports = { upload, resizeIfNeeded };
