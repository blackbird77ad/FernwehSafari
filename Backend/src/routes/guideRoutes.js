const express = require("express");
const {
  adminDecision,
  companyDecision,
  createGuideApplication,
  createGuideBooking,
  listGuideApplications,
  listGuideBookings,
  updateGuideBookingStatus
} = require("../controllers/guideApplicationController");
const { auth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/applications", auth, createGuideApplication);
router.get("/applications", auth, listGuideApplications);
router.patch("/applications/:id/company-decision", auth, companyDecision);
router.patch("/applications/:id/admin-decision", auth, adminDecision);
router.post("/bookings", optionalAuth, createGuideBooking);
router.get("/bookings", auth, listGuideBookings);
router.patch("/bookings/:id", auth, updateGuideBookingStatus);

module.exports = router;
