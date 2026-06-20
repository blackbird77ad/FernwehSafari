const express = require("express");
const {
  createEnquiry,
  listEnquiries,
  listMyEnquiries,
  updateEnquiryStatus
} = require("../controllers/enquiryController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post("/", optionalAuth, createEnquiry);
router.get("/me", auth, listMyEnquiries);
router.get("/", auth, adminOnly, listEnquiries);
router.patch("/:id", auth, adminOnly, updateEnquiryStatus);

module.exports = router;
