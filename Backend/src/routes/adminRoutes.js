const express = require("express");
const { getAdminDashboardSummary } = require("../controllers/adminDashboardController");
const { auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/dashboard", auth, adminOnly, getAdminDashboardSummary);

module.exports = router;
