const mongoose = require("mongoose");

const tourGuideBookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Tour is required."]
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guide is required."]
    },
    requester: {
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
    travelDates: {
      type: String,
      trim: true
    },
    groupSize: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["requested", "accepted", "declined", "closed"],
      default: "requested"
    },
    decidedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TourGuideBooking", tourGuideBookingSchema);
