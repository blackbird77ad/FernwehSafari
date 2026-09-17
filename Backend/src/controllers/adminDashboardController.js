const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Enquiry = require("../models/Enquiry");
const GalleryMedia = require("../models/GalleryMedia");
const Referral = require("../models/Referral");
const Tour = require("../models/Tour");
const TourCompanyApplication = require("../models/TourCompanyApplication");
const TourGuideApplication = require("../models/TourGuideApplication");
const TourGuideBooking = require("../models/TourGuideBooking");
const TourPartner = require("../models/TourPartner");
const TourReview = require("../models/TourReview");
const User = require("../models/User");

function normalizeCount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeMoney(value) {
  return Math.round(normalizeCount(value) * 100) / 100;
}

function normalizeRoleCounts(roleCounts = []) {
  const counts = User.USER_ROLES.reduce((totals, role) => {
    totals[role] = 0;
    return totals;
  }, {});

  roleCounts.forEach((item) => {
    if (item?._id) {
      counts[item._id] = normalizeCount(item.count);
    }
  });

  return counts;
}

const getAdminDashboardSummary = asyncHandler(async (req, res) => {
  const [
    users,
    userRoleCounts,
    tours,
    activeTours,
    pendingTours,
    partners,
    activePartners,
    companyApplications,
    pendingCompanyApplications,
    approvedCompanyApplications,
    rejectedCompanyApplications,
    guideApplications,
    pendingGuideConfirmations,
    guideBookings,
    requestedGuideBookings,
    galleryMedia,
    pendingGalleryMedia,
    tourReviews,
    pendingTourReviews,
    enquiries,
    openEnquiries,
    openQuoteEnquiries,
    partnerReplyEnquiries,
    paymentPendingEnquiries,
    bookingIntents,
    referralStats
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Tour.countDocuments(),
    Tour.countDocuments({ isActive: true }),
    Tour.countDocuments({ isActive: false }),
    TourPartner.countDocuments(),
    TourPartner.countDocuments({ isActive: true }),
    TourCompanyApplication.countDocuments(),
    TourCompanyApplication.countDocuments({ status: { $nin: ["approved", "rejected"] } }),
    TourCompanyApplication.countDocuments({ status: "approved" }),
    TourCompanyApplication.countDocuments({ status: "rejected" }),
    TourGuideApplication.countDocuments(),
    TourGuideApplication.countDocuments({ status: "company_approved" }),
    TourGuideBooking.countDocuments(),
    TourGuideBooking.countDocuments({ status: "requested" }),
    GalleryMedia.countDocuments(),
    GalleryMedia.countDocuments({ status: "pending" }),
    TourReview.countDocuments(),
    TourReview.countDocuments({ status: "pending" }),
    Enquiry.countDocuments({ isArchived: { $ne: true } }),
    Enquiry.countDocuments({ isArchived: { $ne: true }, status: { $nin: ["closed", "cancelled", "completed"] } }),
    Enquiry.countDocuments({
      isArchived: { $ne: true },
      requestType: "quote",
      status: { $nin: ["closed", "cancelled", "completed"] }
    }),
    Enquiry.countDocuments({ isArchived: { $ne: true }, status: "partner_replied" }),
    Enquiry.countDocuments({ isArchived: { $ne: true }, status: "payment_pending" }),
    Enquiry.countDocuments({
      isArchived: { $ne: true },
      requestType: "booking",
      status: { $nin: ["closed", "cancelled", "completed"] }
    }),
    Referral.aggregate([
      {
        $match: {
          isArchived: { $ne: true }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          converted: {
            $sum: {
              $cond: [{ $or: ["$converted", { $in: ["$status", ["converted", "paid"]] }] }, 1, 0]
            }
          },
          estimated: { $sum: { $ifNull: ["$estimatedCommissionEUR", 0] } },
          confirmed: { $sum: { $ifNull: ["$confirmedCommissionEUR", 0] } },
          paid: { $sum: { $ifNull: ["$paidCommissionEUR", 0] } },
          unpaidCommissions: {
            $sum: {
              $cond: [
                { $gt: [{ $ifNull: ["$confirmedCommissionEUR", 0] }, { $ifNull: ["$paidCommissionEUR", 0] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  const referrals = referralStats[0] || {};
  const referralTotal = normalizeCount(referrals.total);
  const converted = normalizeCount(referrals.converted);
  const confirmed = normalizeMoney(referrals.confirmed);
  const paid = normalizeMoney(referrals.paid);
  const unpaidCommissions = normalizeCount(referrals.unpaidCommissions);
  const dashboardActions =
    normalizeCount(pendingCompanyApplications) +
    normalizeCount(pendingTours) +
    normalizeCount(pendingGuideConfirmations) +
    normalizeCount(pendingGalleryMedia) +
    normalizeCount(pendingTourReviews) +
    normalizeCount(openEnquiries) +
    normalizeCount(requestedGuideBookings) +
    normalizeCount(paymentPendingEnquiries) +
    unpaidCommissions;

  sendResponse(res, 200, {
    counts: {
      users: normalizeCount(users),
      userRoles: normalizeRoleCounts(userRoleCounts),
      tours: normalizeCount(tours),
      activeTours: normalizeCount(activeTours),
      pendingTours: normalizeCount(pendingTours),
      partners: normalizeCount(partners),
      activePartners: normalizeCount(activePartners),
      companyApplications: normalizeCount(companyApplications),
      pendingCompanyApplications: normalizeCount(pendingCompanyApplications),
      approvedCompanyApplications: normalizeCount(approvedCompanyApplications),
      rejectedCompanyApplications: normalizeCount(rejectedCompanyApplications),
      guideApplications: normalizeCount(guideApplications),
      pendingGuideConfirmations: normalizeCount(pendingGuideConfirmations),
      guideBookings: normalizeCount(guideBookings),
      requestedGuideBookings: normalizeCount(requestedGuideBookings),
      galleryMedia: normalizeCount(galleryMedia),
      pendingGalleryMedia: normalizeCount(pendingGalleryMedia),
      tourReviews: normalizeCount(tourReviews),
      pendingTourReviews: normalizeCount(pendingTourReviews),
      enquiries: normalizeCount(enquiries),
      openEnquiries: normalizeCount(openEnquiries),
      openQuoteEnquiries: normalizeCount(openQuoteEnquiries),
      partnerReplyEnquiries: normalizeCount(partnerReplyEnquiries),
      paymentPendingEnquiries: normalizeCount(paymentPendingEnquiries),
      bookingIntents: normalizeCount(bookingIntents),
      referrals: referralTotal,
      convertedReferrals: converted,
      unpaidCommissions,
      dashboardActions
    },
    commissions: {
      estimated: normalizeMoney(referrals.estimated),
      confirmed,
      paid,
      open: Math.max(normalizeMoney(confirmed - paid), 0),
      converted,
      conversionRate: referralTotal ? Math.round((converted / referralTotal) * 100) : 0
    }
  });
});

module.exports = {
  getAdminDashboardSummary
};
