const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const TourPartner = require("../models/TourPartner");

function isStaff(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

const listPartners = asyncHandler(async (req, res) => {
  const filters = isStaff(req.user) && req.query.includeInactive === "true" ? {} : { isActive: true };
  const partners = await TourPartner.find(filters).sort({ name: 1 });
  sendResponse(res, 200, { partners });
});

const createPartner = asyncHandler(async (req, res) => {
  const partner = await TourPartner.create(req.body);
  sendResponse(res, 201, { partner });
});

const updatePartner = asyncHandler(async (req, res) => {
  const partner = await TourPartner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!partner) {
    throw new ApiError(404, "Partner not found.");
  }

  sendResponse(res, 200, { partner });
});

const deletePartner = asyncHandler(async (req, res) => {
  const partner = await TourPartner.findByIdAndDelete(req.params.id);

  if (!partner) {
    throw new ApiError(404, "Partner not found.");
  }

  sendResponse(res, 200, { id: req.params.id });
});

module.exports = {
  createPartner,
  deletePartner,
  listPartners,
  updatePartner
};
