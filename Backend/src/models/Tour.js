const mongoose = require("mongoose");
const slugify = require("../utils/slugify");

const itineraryDaySchema = new mongoose.Schema(
  {
    day: {
      type: Number,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const approvedGuideSchema = new mongoose.Schema(
  {
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourGuideApplication"
    },
    dailyRateEUR: {
      type: Number,
      min: [0, "Guide day rate must be positive."]
    },
    languages: {
      type: [String],
      default: []
    },
    availabilityNote: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    approvedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const tourSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Tour title is required."],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    shortDescription: {
      type: String,
      trim: true
    },
    priceEUR: {
      type: Number,
      required: [true, "Tour price in EUR is required."],
      min: [0, "Tour price must be positive."]
    },
    duration: {
      type: String,
      required: [true, "Tour duration is required."],
      trim: true
    },
    location: {
      type: String,
      required: [true, "Tour location is required."],
      trim: true
    },
    category: {
      type: String,
      required: [true, "Tour category is required."],
      enum: ["Safari", "Beach", "Cultural", "Mountain", "Combination", "Adventure", "Wildlife", "City", "Food", "History", "Honeymoon", "Family"]
    },
    images: {
      type: [String],
      default: []
    },
    vrEnabled: {
      type: Boolean,
      default: false
    },
    vrMediaUrl: {
      type: String,
      trim: true
    },
    vrMediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
    vrCaption: {
      type: String,
      trim: true
    },
    highlights: {
      type: [String],
      default: []
    },
    itinerary: {
      type: [itineraryDaySchema],
      default: []
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPartner",
      required: [true, "Tour partner is required."]
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    approvedGuides: {
      type: [approvedGuideSchema],
      default: []
    },
    referralLink: {
      type: String,
      trim: true
    },
    commissionRatePercent: {
      type: Number,
      min: [0, "Commission rate must be positive."],
      max: [100, "Commission rate cannot exceed 100%."]
    },
    featured: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

tourSchema.pre("validate", function setSlug(next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title);
  }

  next();
});

module.exports = mongoose.model("Tour", tourSchema);
