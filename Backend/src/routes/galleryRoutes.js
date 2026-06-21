const express = require("express");
const {
  createMedia,
  deleteMedia,
  listAllMedia,
  listPublicMedia,
  reviewMedia,
  updateMedia
} = require("../controllers/galleryController");
const { auth, optionalAuth } = require("../middleware/auth");
const staffOnly = require("../middleware/staffOnly");

const router = express.Router();

router.get("/", listPublicMedia);
router.post("/", optionalAuth, createMedia);
router.get("/admin", auth, staffOnly, listAllMedia);
router.put("/:id", auth, staffOnly, updateMedia);
router.patch("/:id/review", auth, staffOnly, reviewMedia);
router.delete("/:id", auth, staffOnly, deleteMedia);

module.exports = router;
