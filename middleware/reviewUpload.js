const multer = require("multer");

// Pehle disk pe save karte the — ab Cloudinary ko file ka "buffer"
// bhejna hai, is liye memoryStorage use kar rahe hain. File disk
// pe kabhi save hi nahi hoti, seedha RAM se Cloudinary ko jaati hai.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ok = /jpeg|jpg|png|webp/.test(file.mimetype);
  cb(ok ? null : new Error("Sirf jpg, png ya webp image allowed hai"), ok);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});
