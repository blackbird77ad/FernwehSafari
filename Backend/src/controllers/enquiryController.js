const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Enquiry = require("../models/Enquiry");
const Tour = require("../models/Tour");
const { sendEnquiryEmails } = require("../lib/resend");

function normalizeMessage(value) {
  return String(value || "").trim();
}

const createEnquiry = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    destination,
    message,
    tour: tourId,
    type = "traveller",
    requestType = "question",
    travelDate,
    groupSize,
    budgetEUR
  } = req.body;

  if (!name || !email) {
    throw new ApiError(422, "Name and email are required.");
  }

  let tour = null;

  if (tourId) {
    tour = await Tour.findById(tourId).populate("partner");

    if (!tour) {
      throw new ApiError(404, "Tour not found.");
    }
  }

  const readableMessage = normalizeMessage(message);

  const enquiry = await Enquiry.create({
    user: req.user?._id,
    name,
    email,
    tour: tour?._id,
    partner: tour?.partner?._id,
    destination,
    message: readableMessage,
    type,
    requestType,
    travelDate: travelDate || undefined,
    groupSize: groupSize === "" || groupSize === undefined ? undefined : Number(groupSize),
    budgetEUR: budgetEUR === "" || budgetEUR === undefined ? undefined : Number(budgetEUR)
  });
  await enquiry.populate(["tour", "partner", "user"]);

  const emailStatus = await sendEnquiryEmails(enquiry);
  sendResponse(res, 201, { enquiry, emailStatus });
});

const listEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find()
    .populate(["tour", "partner", "user"])
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { enquiries });
});

const listMyEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({ user: req.user._id })
    .populate(["tour", "partner"])
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { enquiries });
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate(["tour", "partner", "user"]);

  if (!enquiry) {
    throw new ApiError(404, "Enquiry not found.");
  }

  sendResponse(res, 200, { enquiry });
});

module.exports = {
  createEnquiry,
  listEnquiries,
  listMyEnquiries,
  updateEnquiryStatus
};
