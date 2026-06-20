const express = require("express");
const {
  createTour,
  deleteTour,
  getTourBySlug,
  listTours,
  updateTour
} = require("../controllers/tourController");
const { auth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", optionalAuth, listTours);
router.get("/:slug", getTourBySlug);
router.post("/", auth, createTour);
router.put("/:id", auth, updateTour);
router.delete("/:id", auth, deleteTour);

module.exports = router;
