const express = require("express");
const {
  createReferral,
  getBookingSession,
  listMyReferrals,
  listReferrals,
  markConverted,
  openBookingSession,
  receivePartnerPostback,
  reconcileByTrackingCode
} = require("../controllers/referralController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post("/", optionalAuth, createReferral);
router.post("/postback", receivePartnerPostback);
router.get("/booking/:trackingCode/open", optionalAuth, openBookingSession);
router.get("/booking/:trackingCode", optionalAuth, getBookingSession);
router.get("/me", auth, listMyReferrals);
router.get("/", auth, adminOnly, listReferrals);
router.patch("/tracking/:trackingCode", auth, adminOnly, reconcileByTrackingCode);
router.patch("/:id", auth, adminOnly, markConverted);

module.exports = router;
