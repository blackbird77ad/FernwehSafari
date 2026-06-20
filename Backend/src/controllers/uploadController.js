const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const { isCloudinaryConfigured } = require("../lib/cloudinary");

const uploadImage = asyncHandler(async (req, res) => {
  if (!isCloudinaryConfigured) {
    throw new ApiError(503, "Cloudinary is not configured.");
  }

  if (!req.file?.path) {
    throw new ApiError(422, "Image upload failed.");
  }

  sendResponse(res, 201, {
    url: req.file.path,
    publicId: req.file.filename
  });
});

module.exports = {
  uploadImage
};
