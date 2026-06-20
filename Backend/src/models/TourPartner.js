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
    logo: {
      type: String,
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
