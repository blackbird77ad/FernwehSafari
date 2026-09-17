const express = require("express");
const {
  createReview,
  listPublicReviews,
  listReviews,
  reviewTourReview
} = require("../controllers/reviewController");
const { auth } = require("../middleware/auth");
const staffOnly = require("../middleware/staffOnly");

const router = express.Router();

router.get("/tour/:tourId", listPublicReviews);
router.post("/", auth, createReview);
router.get("/", auth, staffOnly, listReviews);
router.patch("/:id/review", auth, staffOnly, reviewTourReview);

module.exports = router;
