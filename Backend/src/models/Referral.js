const mongoose = require("mongoose");

const REFERRAL_STATUSES = ["clicked", "converted", "paid", "cancelled", "disputed"];

const referralSchema = new mongoose.Schema(
  {
    trackingCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true
    },
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
    outboundUrl: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: REFERRAL_STATUSES,
      default: "clicked"
    },
    converted: {
      type: Boolean,
      default: false
    },
    convertedAt: {
      type: Date
    },
    bookingValueEUR: {
      type: Number,
      min: [0, "Booking value must be positive."]
    },
    bookingCurrency: {
      type: String,
      trim: true,
      default: "EUR"
    },
    partnerBookingId: {
      type: String,
      trim: true
    },
    bookedAt: {
      type: Date
    },
    commissionRatePercent: {
      type: Number,
      min: [0, "Commission rate must be positive."],
      max: [100, "Commission rate cannot exceed 100%."],
      default: 0
    },
    estimatedCommissionEUR: {
      type: Number,
      min: [0, "Estimated commission must be positive."],
      default: 0
    },
    confirmedCommissionEUR: {
      type: Number,
      min: [0, "Confirmed commission must be positive."],
      default: 0
    },
    paidCommissionEUR: {
      type: Number,
      min: [0, "Paid commission must be positive."],
      default: 0
    },
    paidAt: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    },
    reconciliationMethod: {
      type: String,
      enum: ["manual", "partner_postback"],
      default: "manual"
    },
    postbackReceivedAt: {
      type: Date
    },
    postbackPayload: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

referralSchema.statics.REFERRAL_STATUSES = REFERRAL_STATUSES;

module.exports = mongoose.model("Referral", referralSchema);
