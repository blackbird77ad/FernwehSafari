const express = require("express");
const {
  createPartner,
  deletePartner,
  listPartners,
  updatePartner
} = require("../controllers/partnerController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/", optionalAuth, listPartners);
router.post("/", auth, adminOnly, createPartner);
router.put("/:id", auth, adminOnly, updatePartner);
router.delete("/:id", auth, adminOnly, deletePartner);

module.exports = router;
