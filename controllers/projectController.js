const Project = require("../models/Project");
const cloudinary = require("../config/cloudinary");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// =====================================================
// Helper: Cloudinary URL se public_id nikalna
// =====================================================

const getPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;

    const uploadPart = "/upload/";

    const index = url.indexOf(uploadPart);

    if (index === -1) {
      return null;
    }

    let publicId = url.substring(
      index + uploadPart.length
    );

    // version remove karo
    // example: v1234567890/myProjects/main/image.jpg
    publicId = publicId.replace(
      /^v\d+\//,
      ""
    );

    // extension remove karo
    publicId = publicId.replace(
      /\.[^/.]+$/,
      ""
    );

    return publicId;
  } catch (error) {
    console.error(
      "Public ID extraction error:",
      error
    );

    return null;
  }
};


// =====================================================
// Helper: Cloudinary image delete
// =====================================================

const deleteFromCloudinary = async (imageUrl) => {
  try {
    const publicId =
      getPublicIdFromUrl(imageUrl);

    if (!publicId) {
      console.log(
        "Could not find Cloudinary public ID."
      );

      return;
    }

    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      }
    );

    console.log(
      "Deleted from Cloudinary:",
      publicId
    );
  } catch (error) {
    console.error(
      "Cloudinary delete error:",
      error.message
    );
  }
};


// =====================================================
// CREATE PROJECT
// =====================================================

const createProject = async (req, res) => {
  try {

    const {
      title,
      category,
      description,
    } = req.body;

    if (
      !title ||
      !category ||
      !description
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, category and description are required.",
      });
    }

    // Main image required
    if (!req.files?.mainImage?.[0]) {
      return res.status(400).json({
        success: false,
        message:
          "Main image is required.",
      });
    }

    const additionalImages =
      req.files?.additionalImages || [];

    // Maximum 6
    if (
      additionalImages.length > 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum 6 additional images are allowed.",
      });
    }

    // Upload main image
    const mainImageResult =
      await uploadToCloudinary(
        req.files.mainImage[0].buffer,
        "myProjects/main"
      );

    // Upload additional images
    const additionalImageResults =
      await Promise.all(
        additionalImages.map((file) =>
          uploadToCloudinary(
            file.buffer,
            "myProjects/additional"
          )
        )
      );

    const project =
      await Project.create({
        title,
        category,
        description,

        mainImage:
          mainImageResult.secure_url,

        additionalImages:
          additionalImageResults.map(
            (image) =>
              image.secure_url
          ),
      });

    res.status(201).json({
      success: true,
      message:
        "Project created successfully",
      project,
    });

  } catch (error) {

    console.error(
      "Create project error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// GET ALL PROJECTS
// =====================================================

const getProjects = async (req, res) => {
  try {

    const projects =
      await Project.find().sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      projects,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// GET SINGLE PROJECT
// =====================================================

const getProject = async (req, res) => {
  try {

    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// UPDATE PROJECT
// =====================================================

const updateProject = async (req, res) => {
  try {

    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found",
      });
    }


    // =================================================
    // TEXT FIELDS
    // =================================================

    const {
      title,
      category,
      description,
      removeAdditionalImages,
    } = req.body;


    if (title !== undefined) {
      project.title = title;
    }

    if (category !== undefined) {
      project.category = category;
    }

    if (description !== undefined) {
      project.description =
        description;
    }


    // =================================================
    // REMOVE EXISTING ADDITIONAL IMAGES
    // =================================================

    let imagesToRemove = [];

    if (removeAdditionalImages) {

      try {

        imagesToRemove =
          JSON.parse(
            removeAdditionalImages
          );

      } catch (error) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid removeAdditionalImages format.",
        });
      }
    }


    if (
      !Array.isArray(
        imagesToRemove
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "removeAdditionalImages must be an array.",
      });
    }


    // Check whether requested URLs
    // actually belong to this project

    const validImagesToRemove =
      imagesToRemove.filter(
        (image) =>
          project.additionalImages.includes(
            image
          )
      );


    // Remove selected images
    if (
      validImagesToRemove.length > 0
    ) {

      project.additionalImages =
        project.additionalImages.filter(
          (image) =>
            !validImagesToRemove.includes(
              image
            )
        );
    }


    // =================================================
    // NEW ADDITIONAL IMAGES
    // =================================================

    const newAdditionalImages =
      req.files?.additionalImages ||
      [];


    const finalAdditionalCount =
      project.additionalImages.length +
      newAdditionalImages.length;


    if (
      finalAdditionalCount > 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Maximum 6 additional images are allowed. You currently have ${project.additionalImages.length} and are trying to add ${newAdditionalImages.length}.`,
      });
    }


    // Upload new additional images

    if (
      newAdditionalImages.length > 0
    ) {

      const uploadedImages =
        await Promise.all(
          newAdditionalImages.map(
            (file) =>
              uploadToCloudinary(
                file.buffer,
                "myProjects/additional"
              )
          )
        );


      const newUrls =
        uploadedImages.map(
          (image) =>
            image.secure_url
        );


      project.additionalImages.push(
        ...newUrls
      );
    }


    // =================================================
    // MAIN IMAGE REPLACEMENT
    // =================================================

    const newMainImage =
      req.files?.mainImage?.[0];


    let oldMainImage = null;


    if (newMainImage) {

      oldMainImage =
        project.mainImage;


      const uploadedMainImage =
        await uploadToCloudinary(
          newMainImage.buffer,
          "myProjects/main"
        );


      project.mainImage =
        uploadedMainImage.secure_url;
    }


    // =================================================
    // SAVE DATABASE
    // =================================================

    await project.save();


    // =================================================
    // DELETE OLD CLOUDINARY IMAGES
    // AFTER SUCCESSFUL DB UPDATE
    // =================================================

    if (
      validImagesToRemove.length > 0
    ) {

      await Promise.all(
        validImagesToRemove.map(
          (imageUrl) =>
            deleteFromCloudinary(
              imageUrl
            )
        )
      );
    }


    if (oldMainImage) {

      await deleteFromCloudinary(
        oldMainImage
      );
    }


    // =================================================
    // RESPONSE
    // =================================================

    res.status(200).json({
      success: true,
      message:
        "Project updated successfully",
      project,
    });

  } catch (error) {

    console.error(
      "Update project error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// DELETE PROJECT
// =====================================================

const deleteProject = async (req, res) => {
  try {

    const project =
      await Project.findById(
        req.params.id
      );

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not found",
      });
    }


    // Delete main image
    if (project.mainImage) {
      await deleteFromCloudinary(
        project.mainImage
      );
    }


    // Delete additional images
    if (
      project.additionalImages?.length
    ) {

      await Promise.all(
        project.additionalImages.map(
          (imageUrl) =>
            deleteFromCloudinary(
              imageUrl
            )
        )
      );
    }


    await Project.findByIdAndDelete(
      req.params.id
    );


    res.status(200).json({
      success: true,
      message:
        "Project deleted successfully",
    });

  } catch (error) {

    console.error(
      "Delete project error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
};