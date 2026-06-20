const express = require("express");
const {
  createTour,
  deleteTour,
  getTourBySlug,
  listTours,
  updateTour
} = require("../controllers/tourController");
const { auth, optionalAuth } = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/", optionalAuth, listTours);
router.get("/:slug", getTourBySlug);
router.post("/", auth, adminOnly, createTour);
router.put("/:id", auth, adminOnly, updateTour);
router.delete("/:id", auth, adminOnly, deleteTour);

module.exports = router;
