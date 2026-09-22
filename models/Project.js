const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    mainImage: {
      type: String,
      required: true,
    },

    additionalImages: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.length <= 6;
        },
        message: "A project can have a maximum of 6 additional images.",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Project", projectSchema);