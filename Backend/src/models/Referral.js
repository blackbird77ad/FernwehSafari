const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "Referral tour is required."]
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPartner",
      required: [true, "Referral partner is required."]
    },
    clickedAt: {
      type: Date,
      default: Date.now
    },
    converted: {
      type: Boolean,
      default: false
    },
    convertedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referral", referralSchema);
