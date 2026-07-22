const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const TourPartner = require("../models/TourPartner");
const crypto = require("node:crypto");
const { getCommissionSettings, normalizeCommissionRate } = require("../lib/commissionSettings");
const { createApprovedPartnerFromAdmin, normalizePartnerEmail } = require("../lib/partnerApproval");

function isStaff(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

function serializePartner(partner, includeSecret = false) {
  const data = partner.toObject ? partner.toObject() : partner;

  if (!includeSecret) {
    delete data.postbackSecret;
  }

  return data;
}

const listPartners = asyncHandler(async (req, res) => {
  const filters = isStaff(req.user) && req.query.includeInactive === "true" ? {} : { isActive: true };
  const query = TourPartner.find(filters).populate("ownerUser", "name email role suspended").sort({ name: 1 });

  if (isStaff(req.user)) {
    query.select("+postbackSecret");
  }

  const partners = await query;
  sendResponse(res, 200, { partners: partners.map((partner) => serializePartner(partner, isStaff(req.user))) });
});

const createPartner = asyncHandler(async (req, res) => {
  const settings = await getCommissionSettings();
  const payload = {
    ...req.body,
    contactEmail: normalizePartnerEmail(req.body.contactEmail),
    commissionRatePercent: normalizeCommissionRate(req.body.commissionRatePercent, settings.defaultCommissionRatePercent)
  };
  const result = await createApprovedPartnerFromAdmin(payload);
  await result.partner.populate("ownerUser", "name email role suspended");

  sendResponse(res, 201, {
    accountCreated: result.accountCreated,
    emailStatus: result.emailStatus,
    partner: serializePartner(result.partner, true)
  });
});

const updatePartner = asyncHandler(async (req, res) => {
  const partner = await TourPartner.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).select("+postbackSecret");

  if (!partner) {
    throw new ApiError(404, "Partner not found.");
  }

  sendResponse(res, 200, { partner: serializePartner(partner, true) });
});

const rotatePartnerPostbackSecret = asyncHandler(async (req, res) => {
  const partner = await TourPartner.findByIdAndUpdate(
    req.params.id,
    { postbackSecret: crypto.randomBytes(24).toString("hex") },
    { new: true, runValidators: true }
  ).select("+postbackSecret");

  if (!partner) {
    throw new ApiError(404, "Partner not found.");
  }

  sendResponse(res, 200, { partner: serializePartner(partner, true) });
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
  rotatePartnerPostbackSecret,
  updatePartner
};
