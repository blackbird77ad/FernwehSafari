const express = require("express");
const {
  archiveEnquiry,
  createPartnerEnquiryReply,
  createEnquiry,
  deleteEnquiry,
  listPartnerEnquiries,
  listEnquiries,
  listMyEnquiries,
  sendAdminEnquiryMessage,
  updateEnquiryStatus
} = require("../controllers/enquiryController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post("/", optionalAuth, createEnquiry);
router.get("/me", auth, listMyEnquiries);
router.get("/partner", auth, listPartnerEnquiries);
router.get("/", auth, adminOnly, listEnquiries);
router.post("/:id/message", auth, adminOnly, sendAdminEnquiryMessage);
router.post("/:id/partner-reply", auth, createPartnerEnquiryReply);
router.patch("/:id", auth, adminOnly, updateEnquiryStatus);
router.patch("/:id/archive", auth, adminOnly, archiveEnquiry);
router.delete("/:id", auth, adminOnly, deleteEnquiry);

module.exports = router;
