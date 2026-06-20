const mongoose = require("mongoose");

const proposedTourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true
    },
    destination: {
      type: String,
      trim: true
    },
    duration: {
      type: String,
      trim: true
    },
    estimatedPriceEUR: {
      type: String,
      trim: true
    },
    bookingURL: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const tourCompanyApplicationSchema = new mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    contactName: {
      type: String,
      required: [true, "Contact name is required."],
      trim: true
    },
    contactRole: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    whatsapp: {
      type: String,
      trim: true
    },
    companyName: {
      type: String,
      required: [true, "Company name is required."],
      trim: true
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    licenseNumber: {
      type: String,
      trim: true
    },
    taxNumber: {
      type: String,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    bookingURL: {
      type: String,
      trim: true
    },
    headquarters: {
      type: String,
      required: [true, "Company location is required."],
      trim: true
    },
    operatingRegions: {
      type: [String],
      default: []
    },
    tourCategories: {
      type: [String],
      default: []
    },
    yearsOperating: {
      type: String,
      trim: true
    },
    hasInHouseGuides: {
      type: Boolean,
      default: false
    },
    guideCount: {
      type: String,
      trim: true
    },
    guideLanguages: {
      type: [String],
      default: []
    },
    insuranceProvider: {
      type: String,
      trim: true
    },
    emergencyProcess: {
      type: String,
      trim: true
    },
    cancellationPolicy: {
      type: String,
      trim: true
    },
    paymentMethods: {
      type: String,
      trim: true
    },
    commissionExpectation: {
      type: String,
      trim: true
    },
    proposedTours: {
      type: [proposedTourSchema],
      default: []
    },
    notes: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["new", "under_review", "call_scheduled", "approved", "rejected"],
      default: "new"
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
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPartner"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("TourCompanyApplication", tourCompanyApplicationSchema);
