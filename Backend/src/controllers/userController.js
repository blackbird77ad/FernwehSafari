const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Tour = require("../models/Tour");
const User = require("../models/User");
const { serializeUser } = require("./authController");

const saveTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { savedTours: tour._id } },
    { new: true }
  )
    .select("-passwordHash")
    .populate({
      path: "savedTours",
      populate: { path: "partner" }
    });

  sendResponse(res, 200, { user: serializeUser(user) });
});

const removeSavedTour = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedTours: req.params.tourId } },
    { new: true }
  )
    .select("-passwordHash")
    .populate({
      path: "savedTours",
      populate: { path: "partner" }
    });

  sendResponse(res, 200, { user: serializeUser(user) });
});

module.exports = {
  removeSavedTour,
  saveTour
};
