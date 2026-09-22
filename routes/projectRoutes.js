const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes
router.get("/", getProjects);
router.get("/:id", getProject);

// Protected routes
router.post(
  "/",
  protect,
  upload.fields([
    {
      name: "mainImage",
      maxCount: 1,
    },
    {
      name: "additionalImages",
      maxCount: 6,
    },
  ]),
  createProject
);

router.put(
  "/:id",
  protect,
  upload.fields([
    {
      name: "mainImage",
      maxCount: 1,
    },
    {
      name: "additionalImages",
      maxCount: 6,
    },
  ]),
  updateProject
);
router.delete("/:id", protect, deleteProject);

module.exports = router;