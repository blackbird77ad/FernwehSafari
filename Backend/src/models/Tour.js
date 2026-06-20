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
      enum: ["Safari", "Beach", "Cultural", "Mountain", "Combination"]
    },
    images: {
      type: [String],
      default: []
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
    referralLink: {
      type: String,
      trim: true
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
