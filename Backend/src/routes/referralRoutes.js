const express = require("express");
const {
  createReferral,
  listMyReferrals,
  listReferrals,
  markConverted
} = require("../controllers/referralController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post("/", optionalAuth, createReferral);
router.get("/me", auth, listMyReferrals);
router.get("/", auth, adminOnly, listReferrals);
router.patch("/:id", auth, adminOnly, markConverted);

module.exports = router;
