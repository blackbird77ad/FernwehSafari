const express = require("express");
const {
  createReferral,
  listMyReferrals,
  listReferrals,
  markConverted,
  receivePartnerPostback,
  reconcileByTrackingCode
} = require("../controllers/referralController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post("/", optionalAuth, createReferral);
router.post("/postback", receivePartnerPostback);
router.get("/me", auth, listMyReferrals);
router.get("/", auth, adminOnly, listReferrals);
router.patch("/tracking/:trackingCode", auth, adminOnly, reconcileByTrackingCode);
router.patch("/:id", auth, adminOnly, markConverted);

module.exports = router;
