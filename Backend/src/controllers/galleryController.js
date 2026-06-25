const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const GalleryMedia = require("../models/GalleryMedia");
const { notifyOwner, notifyUser } = require("../lib/resend");

function isStaff(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

function publicFilters() {
  const now = new Date();

  return {
    status: "approved",
    isActive: true,
    $and: [
      {
        $or: [{ visibleFrom: { $exists: false } }, { visibleFrom: null }, { visibleFrom: { $lte: now } }]
      },
      {
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gt: now } }]
      }
    ]
  };
}

function cleanDate(value) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function galleryPayload(body) {
  return {
    title: body.title,
    description: body.description,
    mediaType: body.mediaType || "image",
    url: body.url,
    thumbnailUrl: body.thumbnailUrl,
    location: body.location,
    travelDate: body.travelDate,
    creditName: body.creditName,
    creditEmail: body.creditEmail,
    status: body.status,
    isActive: body.isActive,
    visibleFrom: cleanDate(body.visibleFrom),
    expiresAt: cleanDate(body.expiresAt)
  };
}

const listPublicMedia = asyncHandler(async (req, res) => {
  const media = await GalleryMedia.find(publicFilters()).sort({ createdAt: -1 });
  sendResponse(res, 200, { media });
});

const listAllMedia = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  const media = await GalleryMedia.find(filters)
    .populate(["submittedBy", "reviewedBy"])
    .sort({ createdAt: -1 });

  sendResponse(res, 200, { media });
});

const createMedia = asyncHandler(async (req, res) => {
  const staffSubmitter = isStaff(req.user);
  const media = await GalleryMedia.create({
    ...galleryPayload(req.body),
    submittedBy: req.user?._id,
    status: staffSubmitter ? req.body.status || "approved" : "pending",
    reviewedBy: staffSubmitter ? req.user._id : undefined,
    reviewedAt: staffSubmitter ? new Date() : undefined
  });

  await notifyOwner(`New gallery ${staffSubmitter ? "post" : "submission"}: ${media.title}`, [
    `Title: ${media.title}`,
    `Type: ${media.mediaType}`,
    `Location: ${media.location || "Not provided"}`,
    `Credit: ${media.creditName || req.user?.name || "Not provided"}`,
    `Status: ${media.status}`,
    `URL: ${media.url}`
  ]);

  sendResponse(res, 201, { media });
});

const updateMedia = asyncHandler(async (req, res) => {
  const media = await GalleryMedia.findByIdAndUpdate(req.params.id, galleryPayload(req.body), {
    new: true,
    runValidators: true
  }).populate(["submittedBy", "reviewedBy"]);

  if (!media) {
    throw new ApiError(404, "Gallery media not found.");
  }

  sendResponse(res, 200, { media });
});

const reviewMedia = asyncHandler(async (req, res) => {
  const { status, reviewNotes = "" } = req.body;

  if (!["approved", "rejected", "pending"].includes(status)) {
    throw new ApiError(422, "Status must be approved, rejected or pending.");
  }

  const media = await GalleryMedia.findById(req.params.id).populate("submittedBy");

  if (!media) {
    throw new ApiError(404, "Gallery media not found.");
  }

  media.status = status;
  media.reviewNotes = reviewNotes;
  media.reviewedBy = req.user._id;
  media.reviewedAt = new Date();
  await media.save();

  const recipient = media.creditEmail || media.submittedBy?.email;

  if (recipient) {
    await notifyUser(recipient, `Travellex gallery submission ${status}`, [
      `Hello ${media.creditName || media.submittedBy?.name || "traveller"},`,
      "",
      `Your gallery submission "${media.title}" is now ${status}.`,
      reviewNotes || "",
      "",
      "Travellex"
    ]);
  }

  await media.populate(["submittedBy", "reviewedBy"]);
  sendResponse(res, 200, { media });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const media = await GalleryMedia.findByIdAndDelete(req.params.id);

  if (!media) {
    throw new ApiError(404, "Gallery media not found.");
  }

  sendResponse(res, 200, { id: req.params.id });
});

module.exports = {
  createMedia,
  deleteMedia,
  listAllMedia,
  listPublicMedia,
  reviewMedia,
  updateMedia
};
