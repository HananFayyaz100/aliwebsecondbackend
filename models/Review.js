const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    profession: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    rating: { type: Number, required: true, min: 1, max: 5 },

    // Cloudinary se milne wala secure URL — frontend seedha isi se image dikhata hai
    image: { type: String, default: "" },

    // Cloudinary ka public_id — sirf isi se hum update/delete ke waqt
    // purani image Cloudinary se hata sakte hain
    imagePublicId: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
