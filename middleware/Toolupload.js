const multer = require("multer");

// memoryStorage — file disk pe kabhi save nahi hoti, seedha RAM se
// Cloudinary ko jaati hai (reviewUpload.js jaisa hi pattern)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ok = /jpeg|jpg|png|webp|svg\+xml/.test(file.mimetype);
  cb(ok ? null : new Error("Sirf jpg, png, webp ya svg image allowed hai"), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});