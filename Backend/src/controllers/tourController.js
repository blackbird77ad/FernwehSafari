const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const slugify = require("../utils/slugify");
const Tour = require("../models/Tour");

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

const listTours = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === "admin" && req.query.includeInactive === "true";
  const tours = await Tour.find(buildTourQuery(req.query, includeInactive))
    .populate("partner")
    .sort({ featured: -1, createdAt: -1 });

  sendResponse(res, 200, { tours });
});

const getTourBySlug = asyncHandler(async (req, res) => {
  const tour = await Tour.findOne({ slug: req.params.slug, isActive: true }).populate("partner");

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  sendResponse(res, 200, { tour });
});

const createTour = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    slug: req.body.slug || (await uniqueSlug(req.body.title))
  };

  const tour = await Tour.create(payload);
  await tour.populate("partner");
  sendResponse(res, 201, { tour });
});

const updateTour = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

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

  sendResponse(res, 200, { tour });
});

const deleteTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  sendResponse(res, 200, { id: req.params.id });
});

module.exports = {
  createTour,
  deleteTour,
  getTourBySlug,
  listTours,
  updateTour
};
