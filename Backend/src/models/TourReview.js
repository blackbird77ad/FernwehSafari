const mongoose = require("mongoose");

const REVIEW_STATUSES = ["pending", "approved", "rejected"];

const reviewAttachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      required: [true, "Attachment URL is required."],
      trim: true
    },
    mediaType: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const tourReviewSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Tour is required."]
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral",
      required: [true, "Paid booking record is required."],
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer is required."]
    },
    name: {
      type: String,
      required: [true, "Review name is required."],
      trim: true
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
      min: [1, "Rating must be at least 1."],
      max: [5, "Rating cannot exceed 5."]
    },
    title: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      required: [true, "Review comment is required."],
      trim: true
    },
    attachments: {
      type: [reviewAttachmentSchema],
      default: []
    },
    status: {
      type: String,
      enum: REVIEW_STATUSES,
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
    }
  },
  { timestamps: true }
);

tourReviewSchema.index({ tour: 1, status: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model("TourReview", tourReviewSchema);
module.exports.REVIEW_STATUSES = REVIEW_STATUSES;
