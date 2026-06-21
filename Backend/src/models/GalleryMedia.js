const mongoose = require("mongoose");

const galleryMediaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Media title is required."],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
    url: {
      type: String,
      required: [true, "Media URL is required."],
      trim: true
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    travelDate: {
      type: String,
      trim: true
    },
    creditName: {
      type: String,
      trim: true
    },
    creditEmail: {
      type: String,
      lowercase: true,
      trim: true
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    visibleFrom: {
      type: Date
    },
    expiresAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("GalleryMedia", galleryMediaSchema);
