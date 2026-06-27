const crypto = require("node:crypto");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Referral = require("../models/Referral");
const Tour = require("../models/Tour");
const { notifyOwner } = require("../lib/resend");

function toNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function safeEqual(left = "", right = "") {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function appendTrackingParams(rawUrl, trackingCode, tour) {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    url.searchParams.set("travellex_ref", trackingCode);
    url.searchParams.set("travellex_tour", String(tour._id));
    url.searchParams.set("travellex_partner", String(tour.partner?._id || tour.partner));
    url.searchParams.set("utm_source", "travellex");
    url.searchParams.set("utm_medium", "referral");
    url.searchParams.set("utm_campaign", tour.slug || tour.title || "tour");
    return url.toString();
  } catch (error) {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}travellex_ref=${encodeURIComponent(trackingCode)}`;
  }
}

function resolveCommissionRate(tour) {
  return toNumber(tour.commissionRatePercent, toNumber(tour.partner?.commissionRatePercent, 0));
}

function normalizeTrackingCode(req) {
  return (
    req.body.travellex_ref ||
    req.body.fernweh_ref ||
    req.body.trackingCode ||
    req.body.referralCode ||
    req.query.travellex_ref ||
    req.query.fernweh_ref ||
    req.query.trackingCode ||
    req.params.trackingCode ||
    ""
  ).trim();
}

function applyReferralReconciliation(referral, payload, method = "manual") {
  const nextStatus = payload.status || "converted";

  if (!Referral.REFERRAL_STATUSES.includes(nextStatus)) {
    throw new ApiError(422, `Status must be one of: ${Referral.REFERRAL_STATUSES.join(", ")}.`);
  }

  const commissionRatePercent = toNumber(payload.commissionRatePercent, referral.commissionRatePercent);
  const bookingValueEUR = toNumber(payload.bookingValueEUR || payload.bookingAmountEUR, referral.bookingValueEUR || referral.tour?.priceEUR || 0);
  const calculatedCommission = roundMoney((bookingValueEUR * commissionRatePercent) / 100);

  referral.status = nextStatus;
  referral.converted = ["converted", "paid"].includes(nextStatus);
  referral.convertedAt = referral.converted && !referral.convertedAt ? new Date() : referral.convertedAt;
  referral.bookingValueEUR = bookingValueEUR;
  referral.bookingCurrency = payload.bookingCurrency || payload.currency || referral.bookingCurrency || "EUR";
  referral.partnerBookingId = payload.partnerBookingId || payload.bookingId || referral.partnerBookingId;
  referral.bookedAt = payload.bookedAt ? new Date(payload.bookedAt) : referral.bookedAt;
  referral.commissionRatePercent = commissionRatePercent;
  referral.confirmedCommissionEUR = toNumber(payload.commissionEUR || payload.confirmedCommissionEUR, calculatedCommission);
  referral.paidCommissionEUR = toNumber(payload.paidCommissionEUR, referral.paidCommissionEUR);
  referral.notes = payload.notes !== undefined ? payload.notes : referral.notes;
  referral.reconciliationMethod = method;

  if (method === "partner_postback") {
    referral.postbackReceivedAt = new Date();
    referral.postbackPayload = payload;
  }

  if (nextStatus === "paid" && !referral.paidAt) {
    referral.paidAt = new Date();
  }
}

function runInBackground(task) {
  Promise.resolve()
    .then(task)
    .catch(() => null);
}

const createReferral = asyncHandler(async (req, res) => {
  const tourId = req.body.tour || req.body.tourId;

  if (!tourId) {
    throw new ApiError(422, "Tour is required to create a referral.");
  }

  const tour = await Tour.findById(tourId).populate("partner");

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  const trackingCode = crypto.randomUUID();
  const commissionRatePercent = resolveCommissionRate(tour);
  const baseBookingURL = tour.referralLink || tour.partner.bookingURL;

  if (!baseBookingURL) {
    throw new ApiError(422, "This tour does not have a booking URL configured yet.");
  }

  const bookingURL = appendTrackingParams(baseBookingURL, trackingCode, tour);
  const estimatedCommissionEUR = roundMoney((toNumber(tour.priceEUR) * commissionRatePercent) / 100);

  const referral = await Referral.create({
    trackingCode,
    user: req.user?._id,
    tour: tour._id,
    partner: tour.partner._id,
    outboundUrl: bookingURL,
    commissionRatePercent,
    estimatedCommissionEUR,
    ipAddress: req.ip,
    userAgent: req.get("user-agent")
  });
  await referral.populate(["tour", "partner", "user"]);

  sendResponse(res, 201, {
    referral,
    bookingPath: `/booking/${trackingCode}`
  });
});

const getBookingSession = asyncHandler(async (req, res) => {
  const trackingCode = normalizeTrackingCode(req);

  if (!trackingCode) {
    throw new ApiError(422, "Tracking code is required.");
  }

  const referral = await Referral.findOne({ trackingCode }).populate(["tour", "partner"]);

  if (!referral) {
    throw new ApiError(404, "Booking session not found.");
  }

  sendResponse(res, 200, {
    referral: {
      _id: referral._id,
      trackingCode: referral.trackingCode,
      status: referral.status,
      converted: referral.converted,
      clickedAt: referral.clickedAt,
      tour: referral.tour,
      partner: referral.partner
    }
  });
});

const openBookingSession = asyncHandler(async (req, res) => {
  const trackingCode = normalizeTrackingCode(req);

  if (!trackingCode) {
    throw new ApiError(422, "Tracking code is required.");
  }

  const referral = await Referral.findOne({ trackingCode });

  if (!referral?.outboundUrl) {
    throw new ApiError(404, "Booking session not found.");
  }

  res.redirect(302, referral.outboundUrl);
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
  const referral = await Referral.findById(req.params.id).populate(["tour", "partner", "user"]);

  if (!referral) {
    throw new ApiError(404, "Referral not found.");
  }

  applyReferralReconciliation(referral, req.body, "manual");
  await referral.save();

  sendResponse(res, 200, { referral });
});

const reconcileByTrackingCode = asyncHandler(async (req, res) => {
  const trackingCode = normalizeTrackingCode(req);

  if (!trackingCode) {
    throw new ApiError(422, "Tracking code is required.");
  }

  const referral = await Referral.findOne({ trackingCode }).populate(["tour", "partner", "user"]);

  if (!referral) {
    throw new ApiError(404, "Referral tracking code not found.");
  }

  applyReferralReconciliation(referral, req.body, "manual");
  await referral.save();

  sendResponse(res, 200, { referral });
});

const receivePartnerPostback = asyncHandler(async (req, res) => {
  const trackingCode = normalizeTrackingCode(req);

  if (!trackingCode) {
    throw new ApiError(422, "travellex_ref or trackingCode is required.");
  }

  const referral = await Referral.findOne({ trackingCode })
    .populate("tour")
    .populate({ path: "partner", select: "+postbackSecret name commissionRatePercent" })
    .populate("user");

  if (!referral) {
    throw new ApiError(404, "Referral tracking code not found.");
  }

  const providedSecret =
    req.get("x-travellex-partner-secret") ||
    req.get("x-fernweh-partner-secret") ||
    req.body.partnerSecret ||
    req.query.partnerSecret;
  const partnerSecret = referral.partner?.postbackSecret;
  const globalSecret = process.env.REFERRAL_POSTBACK_SECRET;
  const isAuthorized =
    (partnerSecret && safeEqual(providedSecret, partnerSecret)) || (globalSecret && safeEqual(providedSecret, globalSecret));

  if (!isAuthorized) {
    throw new ApiError(403, "Invalid partner postback secret.");
  }

  applyReferralReconciliation(referral, req.body, "partner_postback");
  await referral.save();

  runInBackground(() =>
    notifyOwner(`Partner postback received: ${referral.trackingCode}`, [
      `Tracking code: ${referral.trackingCode}`,
      `Tour: ${referral.tour?.title || "Not provided"}`,
      `Partner: ${referral.partner?.name || "Not provided"}`,
      `Traveller: ${referral.user ? `${referral.user.name} (${referral.user.email})` : "Not attached"}`,
      `Status: ${referral.status}`,
      `Booking value ${referral.bookingCurrency || "EUR"}: ${referral.bookingValueEUR || 0}`,
      `Commission rate: ${referral.commissionRatePercent || 0}%`,
      `Confirmed commission EUR: ${referral.confirmedCommissionEUR || 0}`,
      `Paid commission EUR: ${referral.paidCommissionEUR || 0}`,
      `Partner booking ID: ${referral.partnerBookingId || "Not provided"}`,
      `Received at: ${referral.postbackReceivedAt ? referral.postbackReceivedAt.toISOString() : new Date().toISOString()}`
    ])
  );

  sendResponse(res, 200, {
    referral,
    message: "Partner booking postback received."
  });
});

module.exports = {
  createReferral,
  getBookingSession,
  listMyReferrals,
  listReferrals,
  markConverted,
  openBookingSession,
  receivePartnerPostback,
  reconcileByTrackingCode
};
