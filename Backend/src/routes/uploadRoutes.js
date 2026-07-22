const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { uploadImage } = require("../controllers/uploadController");
const { cloudinary, isCloudinaryConfigured } = require("../lib/cloudinary");
const { auth } = require("../middleware/auth");
const ApiError = require("../utils/apiError");

const router = express.Router();
const storage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "travellex/tours",
        resource_type: "auto",
        allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "webm", "mov", "m4v"]
      }
    })
  : multer.memoryStorage();
const upload = multer({ storage });

function mediaUploadAccess(req, res, next) {
  if (!req.user || !["admin", "moderator", "tour_company"].includes(req.user.role)) {
    next(new ApiError(403, "Approved partner or staff access required."));
    return;
  }

  next();
}

router.post("/", auth, mediaUploadAccess, upload.single("image"), uploadImage);

module.exports = router;
