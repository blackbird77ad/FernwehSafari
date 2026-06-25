const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { uploadImage } = require("../controllers/uploadController");
const { cloudinary, isCloudinaryConfigured } = require("../lib/cloudinary");
const { auth } = require("../middleware/auth");
const staffOnly = require("../middleware/staffOnly");

const router = express.Router();
const storage = isCloudinaryConfigured
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        folder: "travellex/tours",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
      }
    })
  : multer.memoryStorage();
const upload = multer({ storage });

router.post("/", auth, staffOnly, upload.single("image"), uploadImage);

module.exports = router;
