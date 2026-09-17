const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Referral = require("../models/Referral");
const Tour = require("../models/Tour");
const TourReview = require("../models/TourReview");
const { notifyOwner, notifyUser } = require("../lib/resend");

const clientUrl = (process.env.CLIENT_URL || "https://travellex.tours").replace(/\/+$/, "");

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return String(value || "")
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => ({ url }));
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return { url: item.trim() };
      }

      return {
        name: String(item?.name || "").trim(),
        url: String(item?.url || "").trim(),
        mediaType: String(item?.mediaType || "").trim()
      };
    })
    .filter((item) => item.url);
}

async function recalculateTourReviewStats(tourId) {
  const stats = await TourReview.aggregate([
    {
      $match: {
        tour: tourId,
        status: "approved",
        isActive: true
      }
    },
    {
      $group: {
        _id: "$tour",
        count: { $sum: 1 },
        rating: { $avg: "$rating" }
      }
    }
  ]);
  const nextStats = stats[0] || { count: 0, rating: 0 };

  await Tour.findByIdAndUpdate(tourId, {
    reviewCount: nextStats.count,
    reviewRating: Math.round((Number(nextStats.rating) || 0) * 10) / 10
  });
}

const listPublicReviews = asyncHandler(async (req, res) => {
  const reviews = await TourReview.find({
    tour: req.params.tourId,
    status: "approved",
    isActive: true
  })
    .populate("user", "name country")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, { reviews });
});

const listReviews = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.tour) {
    filters.tour = req.query.tour;
  }

  const reviews = await TourReview.find(filters)
    .populate(["tour", "referral"])
    .populate("user", "name email country")
    .populate("reviewedBy", "name email role")
    .sort({ createdAt: -1 });

  sendResponse(res, 200, { reviews });
});

const createReview = asyncHandler(async (req, res) => {
  const tourId = req.body.tour || req.body.tourId || req.params.tourId;

  if (!tourId) {
    throw new ApiError(422, "Tour is required.");
  }

  const tour = await Tour.findById(tourId);

  if (!tour || !tour.isActive) {
    throw new ApiError(404, "Active tour not found.");
  }

  const paidReferralFilters = {
    user: req.user._id,
    tour: tour._id,
    status: "paid"
  };

  if (req.body.referral || req.body.referralId) {
    paidReferralFilters._id = req.body.referral || req.body.referralId;
  }

  const referral = await Referral.findOne(paidReferralFilters);

  if (!referral) {
    throw new ApiError(403, "Only travellers with a paid booking for this tour can submit a review.");
  }

  const existingReview = await TourReview.findOne({ referral: referral._id });

  if (existingReview) {
    throw new ApiError(409, "A review has already been submitted for this paid booking.");
  }

  const review = await TourReview.create({
    tour: tour._id,
    referral: referral._id,
    user: req.user._id,
    name: req.body.name || req.user.name,
    rating: Number(req.body.rating),
    title: req.body.title,
    comment: req.body.comment,
    attachments: normalizeAttachments(req.body.attachments),
    status: "pending"
  });

  await review.populate(["tour", "referral"]);
  await review.populate("user", "name email country");

  await notifyOwner(`New tour review pending: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Reviewer: ${req.user.name} (${req.user.email})`,
    `Rating: ${review.rating}`,
    `Title: ${review.title || "Not provided"}`,
    "",
    review.comment,
    "",
    `Open admin portal: ${clientUrl}/admin`
  ]);

  sendResponse(res, 201, { review });
});

const reviewTourReview = asyncHandler(async (req, res) => {
  const { status, reviewNotes = "" } = req.body;

  if (!TourReview.REVIEW_STATUSES.includes(status)) {
    throw new ApiError(422, `Status must be one of: ${TourReview.REVIEW_STATUSES.join(", ")}.`);
  }

  const review = await TourReview.findById(req.params.id)
    .populate("tour")
    .populate("user", "name email country");

  if (!review) {
    throw new ApiError(404, "Tour review not found.");
  }

  review.status = status;
  review.reviewNotes = reviewNotes;
  review.reviewedBy = req.user._id;
  review.reviewedAt = new Date();
  await review.save();
  await recalculateTourReviewStats(review.tour._id);

  let emailStatus = null;

  if (review.user?.email) {
    emailStatus = await notifyUser(review.user.email, `Travellex review ${status}`, [
      `Hello ${review.user.name || review.name},`,
      "",
      `Your review for ${review.tour?.title || "this tour"} is now ${status}.`,
      reviewNotes || "",
      "",
      "Travellex"
    ]);
  }

  await review.populate("reviewedBy", "name email role");
  sendResponse(res, 200, { review, emailStatus });
});

module.exports = {
  createReview,
  listPublicReviews,
  listReviews,
  reviewTourReview
};
