const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const TourCompanyApplication = require("../models/TourCompanyApplication");
const TourPartner = require("../models/TourPartner");
const User = require("../models/User");
const {
  assignPasswordResetToken,
  buildClientUrl,
  PASSWORD_RESET_TOKEN_TTL_MINUTES
} = require("../lib/accountTokens");
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
    contactName: body.contactName,
    contactRole: body.contactRole,
    email: body.email,
    phone: body.phone,
    whatsapp: body.whatsapp,
    companyName: body.companyName,
    registrationNumber: body.registrationNumber,
    licenseNumber: body.licenseNumber,
    taxNumber: body.taxNumber,
    website: body.website,
    bookingURL: body.bookingURL,
    headquarters: body.headquarters,
    operatingRegions: parseList(body.operatingRegions),
    tourCategories: parseList(body.tourCategories),
    yearsOperating: body.yearsOperating,
    hasInHouseGuides: body.hasInHouseGuides === true || body.hasInHouseGuides === "true",
    guideCount: body.guideCount,
    guideLanguages: parseList(body.guideLanguages),
    insuranceProvider: body.insuranceProvider,
    emergencyProcess: body.emergencyProcess,
    cancellationPolicy: body.cancellationPolicy,
    paymentMethods: body.paymentMethods,
    commissionExpectation: body.commissionExpectation,
    proposedTours: []
  };
}

function randomAccountPassword() {
  return crypto.randomBytes(32).toString("hex");
}

function applicationStatusCopy(status, reviewNotes) {
  const messages = {
    under_review: "Travellex has moved your tour company application into review.",
    call_scheduled: "Travellex has marked your application for a follow-up call. The team will contact you with the next step.",
    rejected: "After review, Travellex cannot approve this listing application at the moment."
  };

  return [
    messages[status] || `Your Travellex application status is now ${status.replace(/_/g, " ")}.`,
    reviewNotes || (status === "rejected" ? "No additional reason was provided." : "")
  ].filter(Boolean);
}

async function approveCompanyApplication(application, adminUser, reviewNotes) {
  let user = await User.findOne({ email: application.email.toLowerCase() }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt +passwordResetTokenHash +passwordResetExpiresAt"
  );
  let setupPasswordUrl = "";
  let accountCreated = false;

  if (!user) {
    user = new User({
      name: application.contactName,
      email: application.email,
      passwordHash: await bcrypt.hash(randomAccountPassword(), 12),
      country: application.headquarters,
      role: "tour_company",
      emailVerified: true,
      emailVerifiedAt: new Date()
    });
    const setupToken = assignPasswordResetToken(user);
    setupPasswordUrl = buildClientUrl(`/reset-password?token=${encodeURIComponent(setupToken)}`);
    accountCreated = true;
    await user.save();
  } else {
    user.role = "tour_company";
    user.suspended = false;
    user.emailVerified = true;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
  }

  const partnerPayload = {
    name: application.companyName,
    bookingURL: application.bookingURL || application.website || "https://example.com",
    location: application.headquarters,
    contactEmail: application.email,
    contactPhone: application.whatsapp || application.phone,
    description: application.notes || `${application.companyName} tour company profile.`,
    commissionTerms: application.commissionExpectation,
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

  const loginUrl = buildClientUrl("/login");
  const emailStatus = await notifyUser(
    application.email,
    "Travellex tour company application approved",
    [
      `Hello ${application.contactName},`,
      "",
      "Your company application has been approved.",
      "Your account now has tour company access and can post tours for Travellex review.",
      accountCreated
        ? `Set password: ${setupPasswordUrl}`
        : `Login: ${loginUrl}`,
      accountCreated
        ? `This password setup link expires in ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes. If it expires, use Forgot password on the login page.`
        : "Use your existing Travellex login. If you do not remember your password, use Forgot password on the login page.",
      "",
      "Travellex"
    ],
    {
      cta: accountCreated
        ? { label: "Set password", href: setupPasswordUrl }
        : { label: "Login", href: loginUrl }
    }
  );

  return { application, emailStatus, accountCreated };
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
    `Has in-house guides: ${application.hasInHouseGuides ? "Yes" : "No"}`
  ]);

  await notifyUser(application.email, "Travellex received your tour company application", [
    `Hello ${application.contactName},`,
    "",
    "Travellex received your tour company listing application.",
    "The team will review your company details and contact you for a call or WhatsApp discussion before approval.",
    "",
    "Travellex"
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
  let emailStatus = null;
  let accountCreated = false;

  if (!validStatuses.includes(status)) {
    throw new ApiError(422, `Status must be one of: ${validStatuses.join(", ")}.`);
  }

  if (status === "approved") {
    const result = await approveCompanyApplication(application, req.user, reviewNotes);
    emailStatus = result.emailStatus;
    accountCreated = result.accountCreated;
  } else {
    application.status = status;
    application.reviewNotes = reviewNotes;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    await application.save();

    emailStatus = await notifyUser(application.email, "Travellex tour company application update", [
      `Hello ${application.contactName},`,
      "",
      ...applicationStatusCopy(status, reviewNotes),
      "",
      "Travellex"
    ]);
  }

  await application.populate(["submittedBy", "linkedUser", "partner", "reviewedBy"]);
  sendResponse(res, 200, { application, accountCreated, emailStatus });
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
