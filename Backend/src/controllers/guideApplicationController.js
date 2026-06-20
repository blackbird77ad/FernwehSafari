const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Tour = require("../models/Tour");
const TourGuideApplication = require("../models/TourGuideApplication");
const TourGuideBooking = require("../models/TourGuideBooking");
const { notifyMany, notifyOwner, notifyUser } = require("../lib/resend");

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isAdmin(user) {
  return user?.role === "admin";
}

function canReviewForCompany(user, tour) {
  return isAdmin(user) || (user?.role === "tour_company" && String(tour.owner) === String(user._id));
}

async function getApplication(id) {
  const application = await TourGuideApplication.findById(id)
    .populate("tour")
    .populate("guide", "name email role country");

  if (!application) {
    throw new ApiError(404, "Tour guide application not found.");
  }

  return application;
}

async function notifyCompanyAndOwner(tour, subject, lines) {
  await tour.populate("partner");
  const recipients = [tour.partner?.contactEmail];
  await notifyOwner(subject, lines);
  await notifyMany(recipients, subject, lines);
}

const createGuideApplication = asyncHandler(async (req, res) => {
  if (req.user.role !== "tour_guide") {
    throw new ApiError(403, "Only tour guide accounts can apply to guide a tour.");
  }

  const tour = await Tour.findById(req.body.tourId || req.body.tour).populate("partner");

  if (!tour || !tour.isActive) {
    throw new ApiError(404, "Active tour not found.");
  }

  const existing = await TourGuideApplication.findOne({
    tour: tour._id,
    guide: req.user._id,
    status: { $in: ["submitted", "company_approved", "admin_approved"] }
  });

  if (existing) {
    throw new ApiError(409, "You already have an active guide application for this tour.");
  }

  const application = await TourGuideApplication.create({
    tour: tour._id,
    guide: req.user._id,
    guideName: req.body.guideName || req.user.name,
    email: req.body.email || req.user.email,
    phone: req.body.phone,
    whatsapp: req.body.whatsapp,
    location: req.body.location,
    languages: parseList(req.body.languages),
    licenseNumber: req.body.licenseNumber,
    certifications: req.body.certifications,
    experienceYears: req.body.experienceYears,
    regions: parseList(req.body.regions),
    dailyRateEUR: Number(req.body.dailyRateEUR),
    availabilityNote: req.body.availabilityNote,
    message: req.body.message
  });

  await notifyCompanyAndOwner(tour, `New tour guide application: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Guide: ${application.guideName} (${application.email})`,
    `Phone: ${application.phone || "Not provided"}`,
    `WhatsApp: ${application.whatsapp || "Not provided"}`,
    `Location: ${application.location || "Not provided"}`,
    `Languages: ${application.languages.join(", ") || "Not provided"}`,
    `Daily rate EUR: ${application.dailyRateEUR || "Not provided"}`,
    "",
    application.message || "No message provided."
  ]);

  sendResponse(res, 201, { application });
});

const listGuideApplications = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.tour) {
    filters.tour = req.query.tour;
  }

  if (req.user.role === "tour_guide") {
    filters.guide = req.user._id;
  }

  if (req.user.role === "tour_company") {
    const ownedTours = await Tour.find({ owner: req.user._id }).select("_id");
    filters.tour = { $in: ownedTours.map((tour) => tour._id) };
  }

  const applications = await TourGuideApplication.find(filters)
    .populate("tour")
    .populate("guide", "name email role country")
    .populate(["companyReviewedBy", "adminReviewedBy"])
    .sort({ createdAt: -1 });

  sendResponse(res, 200, { applications });
});

const companyDecision = asyncHandler(async (req, res) => {
  const application = await getApplication(req.params.id);
  const tour = await Tour.findById(application.tour._id).populate("partner");

  if (!canReviewForCompany(req.user, tour)) {
    throw new ApiError(403, "Only the tour company owner or admin can review this application.");
  }

  const approved = req.body.decision === "approved";
  application.status = approved ? "company_approved" : "company_rejected";
  application.companyReviewNotes = req.body.notes || "";
  application.companyReviewedBy = req.user._id;
  application.companyReviewedAt = new Date();
  await application.save();

  await notifyUser(application.email, `Tour guide application ${approved ? "approved by company" : "rejected"}`, [
    `Hello ${application.guideName},`,
    "",
    approved
      ? `The tour company approved your guide application for ${tour.title}. FernwehSafari admin will now confirm it.`
      : `The tour company did not approve your guide application for ${tour.title}.`,
    application.companyReviewNotes || "",
    "",
    "FernwehSafari"
  ]);

  if (approved) {
    await notifyOwner(`Tour company approved guide application: ${tour.title}`, [
      `Tour: ${tour.title}`,
      `Guide: ${application.guideName}`,
      `Company notes: ${application.companyReviewNotes || "No notes."}`,
      "Admin confirmation is required before this guide is published on the tour."
    ]);
  }

  await application.populate(["tour", "guide", "companyReviewedBy", "adminReviewedBy"]);
  sendResponse(res, 200, { application });
});

const adminDecision = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user)) {
    throw new ApiError(403, "Admin access required.");
  }

  const application = await getApplication(req.params.id);
  const tour = await Tour.findById(application.tour._id);
  const approved = req.body.decision === "approved";

  if (approved && application.status !== "company_approved") {
    throw new ApiError(422, "The tour company must approve this guide before admin confirmation.");
  }

  application.status = approved ? "admin_approved" : "admin_rejected";
  application.adminReviewNotes = req.body.notes || "";
  application.adminReviewedBy = req.user._id;
  application.adminReviewedAt = new Date();
  await application.save();

  if (approved) {
    tour.approvedGuides = [
      ...tour.approvedGuides.filter((item) => String(item.guide) !== String(application.guide._id)),
      {
        guide: application.guide._id,
        application: application._id,
        dailyRateEUR: application.dailyRateEUR,
        languages: application.languages,
        availabilityNote: application.availabilityNote,
        isActive: true,
        approvedAt: new Date()
      }
    ];
    await tour.save();
  }

  await notifyUser(application.email, `FernwehSafari guide application ${approved ? "approved" : "rejected"}`, [
    `Hello ${application.guideName},`,
    "",
    approved
      ? `FernwehSafari approved you as a guide option for ${tour.title}. Your day rate can now appear on the tour.`
      : `FernwehSafari did not approve your guide application for ${tour.title}.`,
    application.adminReviewNotes || "",
    "",
    "FernwehSafari"
  ]);

  await application.populate(["tour", "guide", "companyReviewedBy", "adminReviewedBy"]);
  sendResponse(res, 200, { application });
});

const createGuideBooking = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.body.tourId || req.body.tour).populate("partner");

  if (!tour || !tour.isActive) {
    throw new ApiError(404, "Active tour not found.");
  }

  const guideId = req.body.guideId || req.body.guide;
  const approvedGuide = tour.approvedGuides.find((item) => String(item.guide) === String(guideId) && item.isActive);

  if (!approvedGuide) {
    throw new ApiError(422, "This guide is not approved for the selected tour.");
  }

  const booking = await TourGuideBooking.create({
    tour: tour._id,
    guide: guideId,
    requester: req.user?._id,
    name: req.body.name,
    email: req.body.email,
    travelDates: req.body.travelDates,
    groupSize: req.body.groupSize,
    message: req.body.message
  });
  await booking.populate(["tour", "guide", "requester"]);

  await notifyMany([booking.guide.email, tour.partner?.contactEmail], `New guide booking request: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Guide: ${booking.guide.name}`,
    `Traveller: ${booking.name} (${booking.email})`,
    `Dates: ${booking.travelDates || "Not provided"}`,
    `Group size: ${booking.groupSize || "Not provided"}`,
    "",
    booking.message || "No message provided."
  ]);
  await notifyOwner(`New guide booking request: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Guide: ${booking.guide.name}`,
    `Traveller: ${booking.name} (${booking.email})`
  ]);

  sendResponse(res, 201, { booking });
});

const listGuideBookings = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.user.role === "tour_guide") {
    filters.guide = req.user._id;
  }

  if (req.user.role === "traveller") {
    filters.requester = req.user._id;
  }

  if (req.user.role === "tour_company") {
    const ownedTours = await Tour.find({ owner: req.user._id }).select("_id");
    filters.tour = { $in: ownedTours.map((tour) => tour._id) };
  }

  const bookings = await TourGuideBooking.find(filters)
    .populate(["tour", "guide", "requester"])
    .sort({ createdAt: -1 });

  sendResponse(res, 200, { bookings });
});

const updateGuideBookingStatus = asyncHandler(async (req, res) => {
  const booking = await TourGuideBooking.findById(req.params.id).populate("tour");

  if (!booking) {
    throw new ApiError(404, "Guide booking not found.");
  }

  const canUpdate =
    isAdmin(req.user) ||
    String(booking.guide) === String(req.user._id) ||
    (req.user.role === "tour_company" && String(booking.tour.owner) === String(req.user._id));

  if (!canUpdate) {
    throw new ApiError(403, "You cannot update this guide booking.");
  }

  const statuses = ["requested", "accepted", "declined", "closed"];

  if (!statuses.includes(req.body.status)) {
    throw new ApiError(422, `Status must be one of: ${statuses.join(", ")}.`);
  }

  booking.status = req.body.status;
  booking.decidedAt = new Date();
  await booking.save();
  await booking.populate(["tour", "guide", "requester"]);

  sendResponse(res, 200, { booking });
});

module.exports = {
  adminDecision,
  companyDecision,
  createGuideApplication,
  createGuideBooking,
  listGuideApplications,
  listGuideBookings,
  updateGuideBookingStatus
};
