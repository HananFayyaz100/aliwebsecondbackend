const express = require("express");
const router = express.Router();
const upload = require("../middleware/reviewUpload");
const ctrl = require("../controllers/reviewController");

// Apna existing auth middleware yahan import karein, e.g.:
// const { protect, adminOnly } = require("../middleware/auth");
// Agar abhi nahi hai to neeche wali dummy line hata kar apna middleware laga dein
const protect = (req, res, next) => next();

router.get("/", ctrl.getPublicReviews);                    // website ke liye (public)

router.get("/admin/all", protect, ctrl.getAllReviews);
router.post("/", protect, upload.single("image"), ctrl.createReview);
router.put("/:id", protect, upload.single("image"), ctrl.updateReview);
router.delete("/:id", protect, ctrl.deleteReview);

module.exports = router;