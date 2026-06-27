const mongoose = require("mongoose");

const tourGuideApplicationSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Tour is required."]
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guide account is required."]
    },
    guideName: {
      type: String,
      required: [true, "Guide name is required."],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true
    },
    createdAccountFromApplication: {
      type: Boolean,
      default: false
    },
    phone: {
      type: String,
      trim: true
    },
    whatsapp: {
      type: String,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    languages: {
      type: [String],
      default: []
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    certifications: {
      type: String,
      trim: true
    },
    experienceYears: {
      type: String,
      trim: true
    },
    regions: {
      type: [String],
      default: []
    },
    dailyRateEUR: {
      type: Number,
      min: [0, "Daily rate must be positive."]
    },
    availabilityNote: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["submitted", "company_approved", "company_rejected", "admin_approved", "admin_rejected"],
      default: "submitted"
    },
    companyReviewNotes: {
      type: String,
      trim: true
    },
    companyReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    companyReviewedAt: {
      type: Date
    },
    adminReviewNotes: {
      type: String,
      trim: true
    },
    adminReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    adminReviewedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TourGuideApplication", tourGuideApplicationSchema);
