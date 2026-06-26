const crypto = require("node:crypto");
const mongoose = require("mongoose");

const tourPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Partner name is required."],
      trim: true
    },
    bookingURL: {
      type: String,
      required: [true, "Partner booking URL is required."],
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: [0, "Partner rating cannot be below 0."],
      max: [5, "Partner rating cannot exceed 5."],
      default: 0
    },
    reviewCount: {
      type: Number,
      min: [0, "Partner review count cannot be negative."],
      default: 0
    },
    licenseInfo: {
      type: String,
      trim: true
    },
    logo: {
      type: String,
      trim: true
    },
    commissionRatePercent: {
      type: Number,
      min: [0, "Commission rate must be positive."],
      max: [100, "Commission rate cannot exceed 100%."],
      default: 0
    },
    commissionTerms: {
      type: String,
      trim: true
    },
    postbackSecret: {
      type: String,
      default: () => crypto.randomBytes(24).toString("hex"),
      select: false,
      trim: true
    },
    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourCompanyApplication"
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TourPartner", tourPartnerSchema);
