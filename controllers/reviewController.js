const cloudinary = require("../config/cloudinary");
const Review = require("../models/Review");

// Helper: multer se mila file.buffer Cloudinary pe upload karta hai
// aur { url, publicId } wapas deta hai. base64 data-URI approach use
// kiya hai — koi extra streaming package (streamifier) ki zaroorat nahi.
const uploadReviewImage = async (file) => {
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "reviews",
  });

  return { url: result.secure_url, publicId: result.public_id };
};

// Helper: Cloudinary se image delete karta hai — agar fail ho jaye
// (id na mile, network issue) to bhi poori request crash nahi hogi
const deleteReviewImage = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

// PUBLIC — website pe cards dikhane ke liye
exports.getPublicReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Reviews load nahi ho sake" });
  }
};

// ADMIN — sab reviews (inactive bhi)
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ADMIN — naya review card
exports.createReview = async (req, res) => {
  try {
    const { name, profession, message, rating, order } = req.body;

    if (!name || !profession || !message || !rating) {
      return res
        .status(400)
        .json({ success: false, message: "Name, profession, message aur rating zaroori hain" });
    }

    const num = Number(rating);
    if (isNaN(num) || num < 1 || num > 5) {
      return res.status(400).json({ success: false, message: "Rating 1 se 5 ke darmiyan ho" });
    }

    let image = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await uploadReviewImage(req.file);
      image = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const review = await Review.create({
      name,
      profession,
      message,
      rating: num,
      order: Number(order) || 0,
      image,
      imagePublicId,
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ success: false, message: "Review add nahi hua" });
  }
};

// ADMIN — update
exports.updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review nahi mila" });

    const fields = ["name", "profession", "message", "rating", "order", "isActive"];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) review[f] = req.body[f];
    });

    if (req.file) {
      // pehle purani image Cloudinary se hata dein, phir nayi chaRhayein
      await deleteReviewImage(review.imagePublicId);

      const uploaded = await uploadReviewImage(req.file);
      review.image = uploaded.url;
      review.imagePublicId = uploaded.publicId;
    }

    await review.save();
    res.json({ success: true, data: review });
  } catch (err) {
    console.error("Update review error:", err);
    res.status(500).json({ success: false, message: "Update nahi hua" });
  }
};

// ADMIN — delete
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review nahi mila" });

    await deleteReviewImage(review.imagePublicId);

    res.json({ success: true, message: "Review delete ho gaya" });
  } catch (err) {
    console.error("Delete review error:", err);
    res.status(500).json({ success: false, message: "Delete nahi hua" });
  }
};
