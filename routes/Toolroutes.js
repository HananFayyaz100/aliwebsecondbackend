const express = require("express");
const router = express.Router();
const upload = require("../middleware/Toolupload");
const ctrl = require("../controllers/Toolcontroller");

// Apna existing auth middleware yahan import karein, e.g.:
// const { protect } = require("../middleware/auth");
// Agar abhi nahi hai to neeche wali dummy line hata kar apna middleware laga dein
const protect = (req, res, next) => next();

router.get("/", ctrl.getPublicTools);                    // website ke liye (public)

router.get("/admin/all", protect, ctrl.getAllTools);
router.post("/", protect, upload.single("image"), ctrl.createTool);
router.put("/:id", protect, upload.single("image"), ctrl.updateTool);
router.delete("/:id", protect, ctrl.deleteTool);

module.exports = router;