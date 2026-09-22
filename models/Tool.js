const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // 0 se 100 ke darmiyan — skill/tool proficiency bar ke liye
    percentage: { type: Number, required: true, min: 0, max: 100 },

    // Cloudinary secure URL — frontend seedha isi se icon/logo dikhata hai
    image: { type: String, default: "" },

    // Cloudinary public_id — update/delete ke waqt purani image
    // Cloudinary se hatane ke liye chahiye
    imagePublicId: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tool", toolSchema);