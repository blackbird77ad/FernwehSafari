const express = require("express");
const {
  createCompanyApplication,
  deleteCompanyApplication,
  listCompanyApplications,
  updateCompanyApplicationStatus
} = require("../controllers/applicationController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.post("/tour-companies", optionalAuth, createCompanyApplication);
router.get("/tour-companies", auth, adminOnly, listCompanyApplications);
router.patch("/tour-companies/:id", auth, adminOnly, updateCompanyApplicationStatus);
router.delete("/tour-companies/:id", auth, adminOnly, deleteCompanyApplication);

module.exports = router;
