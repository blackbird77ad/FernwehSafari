const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Referral = require("../models/Referral");
const Tour = require("../models/Tour");

const createReferral = asyncHandler(async (req, res) => {
  const tourId = req.body.tour || req.body.tourId;

  if (!tourId) {
    throw new ApiError(422, "Tour is required to create a referral.");
  }

  const tour = await Tour.findById(tourId).populate("partner");

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  const referral = await Referral.create({
    user: req.user?._id,
    tour: tour._id,
    partner: tour.partner._id
  });
  await referral.populate(["tour", "partner", "user"]);

  sendResponse(res, 201, {
    referral,
    bookingURL: tour.referralLink || tour.partner.bookingURL
  });
});

const listMyReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find({ user: req.user._id })
    .populate(["tour", "partner"])
    .sort({ clickedAt: -1 });
  sendResponse(res, 200, { referrals });
});

const listReferrals = asyncHandler(async (req, res) => {
  const referrals = await Referral.find()
    .populate(["tour", "partner", "user"])
    .sort({ clickedAt: -1 });
  sendResponse(res, 200, { referrals });
});

const markConverted = asyncHandler(async (req, res) => {
  const referral = await Referral.findByIdAndUpdate(
    req.params.id,
    {
      converted: true,
      convertedAt: new Date()
    },
    { new: true }
  ).populate(["tour", "partner", "user"]);

  if (!referral) {
    throw new ApiError(404, "Referral not found.");
  }

  sendResponse(res, 200, { referral });
});

module.exports = {
  createReferral,
  listMyReferrals,
  listReferrals,
  markConverted
};
