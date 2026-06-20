const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour"
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPartner"
    },
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["new", "contacted", "referred", "closed"],
      default: "new"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
