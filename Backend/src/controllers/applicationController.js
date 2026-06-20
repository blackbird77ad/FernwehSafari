const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const TourCompanyApplication = require("../models/TourCompanyApplication");
const TourPartner = require("../models/TourPartner");
const User = require("../models/User");
const { notifyOwner, notifyUser } = require("../lib/resend");

function parseList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeApplicationPayload(body) {
  return {
    ...body,
    operatingRegions: parseList(body.operatingRegions),
    tourCategories: parseList(body.tourCategories),
    guideLanguages: parseList(body.guideLanguages),
    proposedTours: Array.isArray(body.proposedTours) ? body.proposedTours : []
  };
}

function temporaryPassword() {
  return `Fernweh-${crypto.randomBytes(4).toString("hex")}`;
}

async function approveCompanyApplication(application, adminUser, reviewNotes) {
  let user = await User.findOne({ email: application.email.toLowerCase() });
  let generatedPassword = "";

  if (!user) {
    generatedPassword = temporaryPassword();
    user = await User.create({
      name: application.contactName,
      email: application.email,
      passwordHash: await bcrypt.hash(generatedPassword, 12),
      country: application.headquarters,
      role: "tour_company"
    });
  } else {
    user.role = "tour_company";
    await user.save();
  }

  const partnerPayload = {
    name: application.companyName,
    bookingURL: application.bookingURL || application.website || "https://example.com",
    location: application.headquarters,
    contactEmail: application.email,
    contactPhone: application.whatsapp || application.phone,
    description: application.notes || `${application.companyName} tour company profile.`,
    ownerUser: user._id,
    application: application._id,
    isActive: true
  };

  const partner =
    (await TourPartner.findOneAndUpdate({ ownerUser: user._id }, partnerPayload, {
      new: true,
      runValidators: true
    })) || (await TourPartner.create(partnerPayload));

  application.status = "approved";
  application.reviewNotes = reviewNotes;
  application.reviewedBy = adminUser._id;
  application.reviewedAt = new Date();
  application.linkedUser = user._id;
  application.partner = partner._id;
  await application.save();

  await notifyUser(application.email, "FernwehSafari tour company application approved", [
    `Hello ${application.contactName},`,
    "",
    "Your company application has been approved.",
    "Your account now has tour company access and can post tours for FernwehSafari review.",
    generatedPassword ? `Temporary password: ${generatedPassword}` : "Use your existing FernwehSafari login.",
    "",
    "Please update any temporary password after logging in.",
    "FernwehSafari"
  ]);

  return application;
}

const createCompanyApplication = asyncHandler(async (req, res) => {
  const payload = normalizeApplicationPayload(req.body);
  const application = await TourCompanyApplication.create({
    ...payload,
    submittedBy: req.user?._id
  });

  await notifyOwner(`New tour company application: ${application.companyName}`, [
    `Company: ${application.companyName}`,
    `Contact: ${application.contactName} (${application.email})`,
    `Phone: ${application.phone || "Not provided"}`,
    `WhatsApp: ${application.whatsapp || "Not provided"}`,
    `Location: ${application.headquarters}`,
    `Regions: ${application.operatingRegions.join(", ") || "Not provided"}`,
    `Has in-house guides: ${application.hasInHouseGuides ? "Yes" : "No"}`,
    "",
    application.notes || "No additional notes."
  ]);

  await notifyUser(application.email, "FernwehSafari received your tour company application", [
    `Hello ${application.contactName},`,
    "",
    "FernwehSafari received your tour company listing application.",
    "The team will review your company details and contact you for a call or WhatsApp discussion before approval.",
    "",
    "FernwehSafari"
  ]);

  sendResponse(res, 201, { application });
});

const listCompanyApplications = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  const applications = await TourCompanyApplication.find(filters)
    .populate(["submittedBy", "linkedUser", "partner", "reviewedBy"])
    .sort({ createdAt: -1 });

  sendResponse(res, 200, { applications });
});

const updateCompanyApplicationStatus = asyncHandler(async (req, res) => {
  const application = await TourCompanyApplication.findById(req.params.id);

  if (!application) {
    throw new ApiError(404, "Tour company application not found.");
  }

  const { status, reviewNotes = "" } = req.body;
  const validStatuses = ["under_review", "call_scheduled", "approved", "rejected"];

  if (!validStatuses.includes(status)) {
    throw new ApiError(422, `Status must be one of: ${validStatuses.join(", ")}.`);
  }

  if (status === "approved") {
    await approveCompanyApplication(application, req.user, reviewNotes);
  } else {
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    if (status === "rejected") {
      await notifyUser(application.email, "FernwehSafari tour company application update", [
        `Hello ${application.contactName},`,
        "",
        "After review, FernwehSafari cannot approve this listing application at the moment.",
        reviewNotes || "No additional reason was provided.",
        "",
        "FernwehSafari"
      ]);
    }
  }

  await application.populate(["submittedBy", "linkedUser", "partner", "reviewedBy"]);
  sendResponse(res, 200, { application });
});

const deleteCompanyApplication = asyncHandler(async (req, res) => {
  const application = await TourCompanyApplication.findByIdAndDelete(req.params.id);

  if (!application) {
    throw new ApiError(404, "Tour company application not found.");
  }

  sendResponse(res, 200, { id: req.params.id });
});

module.exports = {
  createCompanyApplication,
  deleteCompanyApplication,
  listCompanyApplications,
  updateCompanyApplicationStatus
};
