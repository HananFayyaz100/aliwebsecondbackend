const cloudinary = require("../config/cloudinary");
const Tool = require("../models/Tool");

// Helper: multer se mila file.buffer Cloudinary pe upload karta hai
const uploadToolImage = async (file) => {
  const base64 = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "tools",
  });

  return { url: result.secure_url, publicId: result.public_id };
};

// Helper: Cloudinary se image delete — fail ho bhi jaye to request crash nahi hogi
const deleteToolImage = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
  }
};

// PUBLIC — website ke "skills/tools" section ke liye
exports.getPublicTools = async (req, res) => {
  try {
    const tools = await Tool.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select("-__v");
    res.json({ success: true, data: tools });
  } catch (err) {
    res.status(500).json({ success: false, message: "Tools load nahi ho sake" });
  }
};

// ADMIN — sab tools (inactive bhi)
exports.getAllTools = async (req, res) => {
  try {
    const tools = await Tool.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: tools });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ADMIN — naya tool add karna
exports.createTool = async (req, res) => {
  try {
    const { name, percentage, order } = req.body;

    if (!name || percentage === undefined || percentage === "") {
      return res.status(400).json({
        success: false,
        message: "Name aur percentage zaroori hain",
      });
    }

    const num = Number(percentage);
    if (isNaN(num) || num < 0 || num > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage 0 se 100 ke darmiyan ho",
      });
    }

    let image = "";
    let imagePublicId = "";

    if (req.file) {
      const uploaded = await uploadToolImage(req.file);
      image = uploaded.url;
      imagePublicId = uploaded.publicId;
    }

    const tool = await Tool.create({
      name,
      percentage: num,
      order: Number(order) || 0,
      image,
      imagePublicId,
    });

    res.status(201).json({ success: true, data: tool });
  } catch (err) {
    console.error("Create tool error:", err);
    res.status(500).json({ success: false, message: "Tool add nahi hua" });
  }
};

// ADMIN — update
exports.updateTool = async (req, res) => {
  try {
    const tool = await Tool.findById(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: "Tool nahi mila" });

    const { name, percentage, order, isActive } = req.body;

    if (name !== undefined) tool.name = name;

    if (percentage !== undefined) {
      const num = Number(percentage);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage 0 se 100 ke darmiyan ho",
        });
      }
      tool.percentage = num;
    }

    if (order !== undefined) tool.order = Number(order) || 0;
    if (isActive !== undefined) tool.isActive = isActive;

    if (req.file) {
      await deleteToolImage(tool.imagePublicId);

      const uploaded = await uploadToolImage(req.file);
      tool.image = uploaded.url;
      tool.imagePublicId = uploaded.publicId;
    }

    await tool.save();
    res.json({ success: true, data: tool });
  } catch (err) {
    console.error("Update tool error:", err);
    res.status(500).json({ success: false, message: "Update nahi hua" });
  }
};

// ADMIN — delete
exports.deleteTool = async (req, res) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) return res.status(404).json({ success: false, message: "Tool nahi mila" });

    await deleteToolImage(tool.imagePublicId);

    res.json({ success: true, message: "Tool delete ho gaya" });
  } catch (err) {
    console.error("Delete tool error:", err);
    res.status(500).json({ success: false, message: "Delete nahi hua" });
  }
};