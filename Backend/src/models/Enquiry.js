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
    destination: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    requestType: {
      type: String,
      enum: ["question", "quote"],
      default: "question"
    },
    travelDate: {
      type: Date
    },
    groupSize: {
      type: Number,
      min: [1, "Group size must be at least 1."]
    },
    budgetEUR: {
      type: Number,
      min: [0, "Budget must be positive."]
    },
    type: {
      type: String,
      enum: ["traveller", "partner_application"],
      default: "traveller"
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
