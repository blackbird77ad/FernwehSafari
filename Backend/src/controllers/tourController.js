const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const slugify = require("../utils/slugify");
const TourPartner = require("../models/TourPartner");
const Tour = require("../models/Tour");
const { notifyOwner, notifyUser } = require("../lib/resend");

const clientUrl = (process.env.CLIENT_URL || "https://travellex.tours").replace(/\/+$/, "");

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

async function buildTourQuery(query, includeInactive = false) {
  const filters = {};
  const andFilters = [];

  if (!includeInactive) {
    filters.isActive = true;
  }

  if (query.category) {
    filters.category = query.category;
  }

  if (query.location) {
    const location = new RegExp(escapeRegExp(query.location), "i");
    const matchingPartners = await TourPartner.find({ location }).select("_id");
    const partnerIds = matchingPartners.map((partner) => partner._id);

    filters.$or = [
      { location },
      { routeSummary: location },
      { startLocation: location },
      { endLocation: location },
      ...(partnerIds.length ? [{ partner: { $in: partnerIds } }] : [])
    ];
  }

  if (query.featured === "true") {
    filters.featured = true;
  }

  if (query.comfortLevel) {
    filters.comfortLevel = query.comfortLevel;
  }

  if (query.tourType) {
    filters.tourType = query.tourType;
  }

  if (query.partner) {
    filters.partner = query.partner;
  }

  if (query.minRating) {
    const minRating = Number(query.minRating);

    if (Number.isFinite(minRating)) {
      const matchingPartners = await TourPartner.find({ rating: { $gte: minRating } }).select("_id");
      const partnerIds = matchingPartners.map((partner) => partner._id);

      andFilters.push({
        $or: [
          { reviewRating: { $gte: minRating } },
          ...(partnerIds.length ? [{ partner: { $in: partnerIds } }] : [])
        ]
      });
    }
  }

  if (query.travelDate) {
    const travelDate = new Date(query.travelDate);

    if (!Number.isNaN(travelDate.getTime())) {
      andFilters.push({
        $or: [{ availableFrom: { $exists: false } }, { availableFrom: null }, { availableFrom: { $lte: travelDate } }]
      });
      andFilters.push({
        $or: [{ availableTo: { $exists: false } }, { availableTo: null }, { availableTo: { $gte: travelDate } }]
      });
    }
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

  if (query.maxDurationDays) {
    filters.durationDays = { ...(filters.durationDays || {}), $lte: Number(query.maxDurationDays) };
  }

  if (query.search) {
    const search = new RegExp(escapeRegExp(query.search), "i");
    const matchingPartners = await TourPartner.find({
      $or: [{ name: search }, { location: search }, { description: search }, { licenseInfo: search }]
    }).select("_id");
    const partnerIds = matchingPartners.map((partner) => partner._id);
    const searchFilters = [
      { title: search },
      { shortDescription: search },
      { description: search },
      { location: search },
      { category: search },
      { highlights: search },
      { routeSummary: search },
      { startLocation: search },
      { endLocation: search },
      { inclusions: search },
      { exclusions: search },
      { languages: search },
      { meetingPoint: search },
      { pickupDetails: search },
      { difficulty: search },
      { transport: search },
      { accommodation: search },
      { meals: search },
      { cancellationPolicy: search },
      { paymentTerms: search },
      { whatToBring: search },
      { notSuitableFor: search },
      { "itinerary.title": search },
      { "itinerary.description": search },
      { comfortLevel: search },
      { tourType: search },
      ...(partnerIds.length ? [{ partner: { $in: partnerIds } }] : [])
    ];

    if (filters.$or) {
      andFilters.push({ $or: filters.$or });
      delete filters.$or;
    }

    andFilters.push({ $or: searchFilters });
  }

  if (andFilters.length) {
    filters.$and = andFilters;
  }

  return filters;
}

function buildTourSort(sort = "featured") {
  const options = {
    featured: { featured: -1, createdAt: -1 },
    newest: { createdAt: -1 },
    "price-asc": { priceEUR: 1, createdAt: -1 },
    "price-desc": { priceEUR: -1, createdAt: -1 },
    "rating-desc": { reviewRating: -1, reviewCount: -1, createdAt: -1 },
    "duration-asc": { durationDays: 1, createdAt: -1 },
    "title-asc": { title: 1 }
  };

  return options[sort] || options.featured;
}

function isStaff(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

function canManageTours(user) {
  return isStaff(user) || user?.role === "tour_company";
}

function canManageTourVr(user) {
  return user?.role === "admin";
}

function stripAdminOnlyTourFields(payload) {
  delete payload.vrEnabled;
  delete payload.vrMediaUrl;
  delete payload.vrMediaType;
  delete payload.vrCaption;
}

function nextNumber(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function ensureValidGroupSizeRange(payload, existingTour = {}) {
  const min = nextNumber(payload.groupSizeMin, existingTour.groupSizeMin);
  const max = nextNumber(payload.groupSizeMax, existingTour.groupSizeMax);

  if (min && max && max < min) {
    throw new ApiError(400, "Maximum group size must be greater than or equal to minimum group size.");
  }
}

async function getOwnedPartner(userId) {
  return TourPartner.findOne({ ownerUser: userId, isActive: true });
}

function partnerNotificationEmail(tour, fallbackUser) {
  return tour.partner?.contactEmail || tour.owner?.email || fallbackUser?.email;
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
  const filters = await buildTourQuery(req.query, includeInactive);
  const sort = buildTourSort(req.query.sort);

  if (req.query.mine === "true") {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    filters.owner = req.user._id;
  }

  const tours = await Tour.find(filters)
    .populate("partner")
    .populate("approvedGuides.guide", "name email country role")
    .sort(sort);

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

  if (!canManageTourVr(req.user)) {
    stripAdminOnlyTourFields(payload);
  }

  ensureValidGroupSizeRange(payload);

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

  if (req.user.role === "tour_company") {
    await notifyUser(partnerNotificationEmail(tour, req.user), "Travellex received your tour listing", [
      `Hello ${req.user.name},`,
      "",
      `Travellex received your tour listing for ${tour.title}.`,
      "The listing is pending staff review before it appears publicly.",
      "",
      "Travellex"
    ]);
  }

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

  if (!canManageTourVr(req.user)) {
    stripAdminOnlyTourFields(payload);
  }

  if (payload.title && !payload.slug) {
    payload.slug = await uniqueSlug(payload.title, req.params.id);
  }

  ensureValidGroupSizeRange(payload, existingTour);

  const wasInactive = existingTour.isActive === false;
  const tour = await Tour.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  }).populate(["partner", "owner"]);

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  const approvedNow = isStaff(req.user) && wasInactive && tour.isActive === true;

  await notifyOwner(`${approvedNow ? "Tour listing approved" : "Tour updated"}: ${tour.title}`, [
    `Tour: ${tour.title}`,
    `Updated by: ${req.user.name} (${req.user.email})`,
    `Role: ${req.user.role}`,
    `Status: ${tour.isActive ? "Active" : "Pending staff review"}`,
    `Partner: ${tour.partner?.name || "Not provided"}`
  ]);

  if (approvedNow) {
    await notifyUser(partnerNotificationEmail(tour), "Travellex approved your tour listing", [
      `Hello ${tour.owner?.name || tour.partner?.name || "partner"},`,
      "",
      `Travellex approved your tour listing for ${tour.title}.`,
      "The listing is now active on the Travellex website.",
      `View listing: ${clientUrl}/tours/${tour.slug}`,
      "",
      "Travellex"
    ]);
  }

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
