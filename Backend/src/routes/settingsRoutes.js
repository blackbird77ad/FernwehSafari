const express = require("express");
const {
  getCommissionSettingsForAdmin,
  updateCommissionSettingsForAdmin
} = require("../controllers/settingsController");
const { auth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/commission", auth, adminOnly, getCommissionSettingsForAdmin);
router.put("/commission", auth, adminOnly, updateCommissionSettingsForAdmin);

module.exports = router;
