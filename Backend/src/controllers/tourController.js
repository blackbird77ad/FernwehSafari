const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const slugify = require("../utils/slugify");
const TourPartner = require("../models/TourPartner");
const Tour = require("../models/Tour");
const { notifyOwner } = require("../lib/resend");

async function uniqueSlug(title, existingId) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;

  while (
    await Tour.findOne({
      slug: candidate,
      ...(existingId ? { _id: { $ne: existingId } } : {})
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function buildTourQuery(query, includeInactive = false) {
  const filters = {};

  if (!includeInactive) {
    filters.isActive = true;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.location) {
    filters.location = new RegExp(query.location, "i");
  }

  if (query.featured === "true") {
    filters.featured = true;
  }

  if (query.minPrice || query.maxPrice) {
    filters.priceEUR = {};

    if (query.minPrice) {
      filters.priceEUR.$gte = Number(query.minPrice);
    }

    if (query.maxPrice) {
      filters.priceEUR.$lte = Number(query.maxPrice);
    }
  }

  if (query.search) {
    filters.$or = [
      { title: new RegExp(query.search, "i") },
      { shortDescription: new RegExp(query.search, "i") },
      { description: new RegExp(query.search, "i") }
    ];
  }

  return filters;
}

function isStaff(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

function canManageTours(user) {
  return isStaff(user) || user?.role === "tour_company";
}

async function getOwnedPartner(userId) {
  return TourPartner.findOne({ ownerUser: userId, isActive: true });
}

async function ensureCanManageTour(req, tour) {
  if (isStaff(req.user)) {
    return;
  }

  if (req.user?.role !== "tour_company") {
    throw new ApiError(403, "Tour company access required.");
  }

  if (String(tour.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You can only manage tours owned by your company.");
  }
}

const listTours = asyncHandler(async (req, res) => {
  const includeInactive =
    (isStaff(req.user) || req.query.mine === "true") && req.query.includeInactive === "true";
  const filters = buildTourQuery(req.query, includeInactive);

  if (req.query.mine === "true") {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    filters.owner = req.user._id;
  }

  const tours = await Tour.find(filters)
    .populate("partner")
    .populate("approvedGuides.guide", "name email country role")
    .sort({ featured: -1, createdAt: -1 });

  sendResponse(res, 200, { tours });
});

const getTourBySlug = asyncHandler(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug, isActive: true })
    .populate("partner")
    .populate("approvedGuides.guide", "name email country role");

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  sendResponse(res, 200, { tour });
});

const createTour = asyncHandler(async (req, res) => {
  if (!canManageTours(req.user)) {
    throw new ApiError(403, "Tour management access required.");
  }

  const payload = {
    ...req.body,
    slug: req.body.slug || (await uniqueSlug(req.body.title))
  };

  if (req.user.role === "tour_company") {
    const partner = await getOwnedPartner(req.user._id);

    if (!partner) {
      throw new ApiError(403, "Your company application must be approved before posting tours.");
    }

    payload.partner = partner._id;
    payload.owner = req.user._id;
    payload.isActive = false;
    payload.featured = false;
  }

  const tour = await Tour.create(payload);
  await tour.populate("partner");

  await notifyOwner(`New tour posted: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Posted by: ${req.user.name} (${req.user.email})`,
    `Role: ${req.user.role}`,
    `Status: ${tour.isActive ? "Active" : "Pending staff review"}`,
    `Location: ${tour.location}`,
    `Price EUR: ${tour.priceEUR}`
  ]);

  sendResponse(res, 201, { tour });
});

const updateTour = asyncHandler(async (req, res) => {
  const existingTour = await Tour.findById(req.params.id);

  if (!existingTour) {
    throw new ApiError(404, "Tour not found.");
  }

  await ensureCanManageTour(req, existingTour);

  const payload = { ...req.body };

  if (!isStaff(req.user)) {
    delete payload.partner;
    delete payload.owner;
    delete payload.featured;
    payload.isActive = false;
  }

  if (payload.title && !payload.slug) {
    payload.slug = await uniqueSlug(payload.title, req.params.id);
  }

  const tour = await Tour.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  }).populate("partner");

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  await notifyOwner(`Tour updated: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Updated by: ${req.user.name} (${req.user.email})`,
    `Role: ${req.user.role}`,
    `Status: ${tour.isActive ? "Active" : "Pending staff review"}`
  ]);

  sendResponse(res, 200, { tour });
});

const deleteTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  await ensureCanManageTour(req, tour);
  await Tour.findByIdAndDelete(req.params.id);

  await notifyOwner(`Tour deleted: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Deleted by: ${req.user.name} (${req.user.email})`,
    `Role: ${req.user.role}`
  ]);

  sendResponse(res, 200, { id: req.params.id });
});

module.exports = {
  createTour,
  deleteTour,
  getTourBySlug,
  listTours,
  updateTour
};
