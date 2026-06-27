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

const COMFORT_LEVELS = ["Budget", "Midrange", "Luxury", "Premium", "Mixed"];
const TOUR_TYPES = ["Private", "Shared", "Private or shared"];

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
    durationDays: {
      type: Number,
      min: [1, "Tour duration days must be at least 1."]
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
    comfortLevel: {
      type: String,
      enum: COMFORT_LEVELS,
      default: "Midrange"
    },
    tourType: {
      type: String,
      enum: TOUR_TYPES,
      default: "Private or shared"
    },
    groupSizeMin: {
      type: Number,
      min: [1, "Minimum group size must be at least 1."]
    },
    groupSizeMax: {
      type: Number,
      min: [1, "Maximum group size must be at least 1."]
    },
    minimumAge: {
      type: Number,
      min: [0, "Minimum age cannot be negative."]
    },
    languages: {
      type: [String],
      default: []
    },
    meetingPoint: {
      type: String,
      trim: true
    },
    pickupIncluded: {
      type: Boolean,
      default: false
    },
    pickupDetails: {
      type: String,
      trim: true
    },
    departureTime: {
      type: String,
      trim: true
    },
    returnTime: {
      type: String,
      trim: true
    },
    difficulty: {
      type: String,
      trim: true
    },
    transport: {
      type: String,
      trim: true
    },
    accommodation: {
      type: String,
      trim: true
    },
    meals: {
      type: String,
      trim: true
    },
    cancellationPolicy: {
      type: String,
      trim: true
    },
    paymentTerms: {
      type: String,
      trim: true
    },
    whatToBring: {
      type: [String],
      default: []
    },
    notSuitableFor: {
      type: [String],
      default: []
    },
    routeSummary: {
      type: String,
      trim: true
    },
    startLocation: {
      type: String,
      trim: true
    },
    endLocation: {
      type: String,
      trim: true
    },
    inclusions: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
    },
    availableFrom: {
      type: Date
    },
    availableTo: {
      type: Date
    },
    reviewRating: {
      type: Number,
      min: [0, "Review rating cannot be below 0."],
      max: [5, "Review rating cannot exceed 5."],
      default: 0
    },
    reviewCount: {
      type: Number,
      min: [0, "Review count cannot be negative."],
      default: 0
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

  if (this.groupSizeMin && this.groupSizeMax && this.groupSizeMax < this.groupSizeMin) {
    this.invalidate("groupSizeMax", "Maximum group size must be greater than or equal to minimum group size.");
  }

  next();
});

module.exports = mongoose.model("Tour", tourSchema);
module.exports.COMFORT_LEVELS = COMFORT_LEVELS;
module.exports.TOUR_TYPES = TOUR_TYPES;
