const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Tour = require("../models/Tour");
const User = require("../models/User");
const { serializeUser } = require("./authController");
const { notifyOwner } = require("../lib/resend");

function serializeAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    country: user.country,
    savedTours: user.savedTours || [],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function ensureValidRole(role) {
  if (!User.USER_ROLES.includes(role)) {
    throw new ApiError(422, `Role must be one of: ${User.USER_ROLES.join(", ")}.`);
  }
}

async function ensureRoleCanChange(targetUser, nextRole, actingUserId) {
  if (String(targetUser._id) === String(actingUserId) && targetUser.role === "admin" && nextRole !== "admin") {
    throw new ApiError(403, "You cannot change your own admin role.");
  }

  if (targetUser.role === "admin" && nextRole !== "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount <= 1) {
      throw new ApiError(422, "At least one admin account must remain.");
    }
  }
}

const listUsers = asyncHandler(async (req, res) => {
  const filters = {};
  const search = req.query.search?.trim();
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
  const skip = (page - 1) * limit;

  if (req.query.role) {
    ensureValidRole(req.query.role);
    filters.role = req.query.role;
  }

  if (search) {
    filters.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { country: new RegExp(search, "i") }
    ];
  }

  const [users, total, roleCounts] = await Promise.all([
    User.find(filters)
      .select("-passwordHash")
      .populate("savedTours")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filters),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }])
  ]);

  const countsByRole = roleCounts.reduce((counts, item) => {
    counts[item._id] = item.count;
    return counts;
  }, {});

  sendResponse(res, 200, {
    users: users.map(serializeAdminUser),
    roles: User.USER_ROLES,
    roleCounts: countsByRole,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1)
    }
  });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, country, role = User.DEFAULT_ROLE } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(422, "Name, email and password are required.");
  }

  if (password.length < 8) {
    throw new ApiError(422, "Password must be at least 8 characters.");
  }

  ensureValidRole(role);

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "An account already exists for this email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    country,
    role
  });

  await notifyOwner(`CRM user created: ${user.name}`, [
    `Created by: ${req.user.name} (${req.user.email})`,
    `User: ${user.name} (${user.email})`,
    `Role: ${user.role}`
  ]);

  sendResponse(res, 201, { user: serializeAdminUser(user) });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const { name, email, password, country, role } = req.body;

  if (role !== undefined) {
    ensureValidRole(role);
    await ensureRoleCanChange(user, role, req.user._id);
    user.role = role;
  }

  if (name !== undefined) {
    user.name = name;
  }

  if (country !== undefined) {
    user.country = country;
  }

  if (email !== undefined && email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });

    if (existingUser) {
      throw new ApiError(409, "An account already exists for this email.");
    }

    user.email = email;
  }

  if (password) {
    if (password.length < 8) {
      throw new ApiError(422, "Password must be at least 8 characters.");
    }

    user.passwordHash = await bcrypt.hash(password, 12);
  }

  await user.save();
  await notifyOwner(`CRM user updated: ${user.name}`, [
    `Updated by: ${req.user.name} (${req.user.email})`,
    `User: ${user.name} (${user.email})`,
    `Role: ${user.role}`
  ]);
  sendResponse(res, 200, { user: serializeAdminUser(user) });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  ensureValidRole(role);

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  await ensureRoleCanChange(user, role, req.user._id);
  user.role = role;
  await user.save();

  await notifyOwner(`User role changed: ${user.name}`, [
    `Changed by: ${req.user.name} (${req.user.email})`,
    `User: ${user.name} (${user.email})`,
    `New role: ${user.role}`
  ]);

  sendResponse(res, 200, { user: serializeAdminUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(403, "You cannot delete your own account.");
  }

  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin" });

    if (adminCount <= 1) {
      throw new ApiError(422, "At least one admin account must remain.");
    }
  }

  await User.findByIdAndDelete(user._id);
  await notifyOwner(`CRM user deleted: ${user.name}`, [
    `Deleted by: ${req.user.name} (${req.user.email})`,
    `User: ${user.name} (${user.email})`,
    `Role: ${user.role}`
  ]);
  sendResponse(res, 200, { id: req.params.id });
});

const saveTour = asyncHandler(async (req, res) => {
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    throw new ApiError(404, "Tour not found.");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { savedTours: tour._id } },
    { new: true }
  )
    .select("-passwordHash")
    .populate({
      path: "savedTours",
      populate: { path: "partner" }
    });

  sendResponse(res, 200, { user: serializeUser(user) });
});

const removeSavedTour = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { savedTours: req.params.tourId } },
    { new: true }
  )
    .select("-passwordHash")
    .populate({
      path: "savedTours",
      populate: { path: "partner" }
    });

  sendResponse(res, 200, { user: serializeUser(user) });
});

module.exports = {
  createUser,
  deleteUser,
  listUsers,
  removeSavedTour,
  saveTour,
  updateUser,
  updateUserRole
};
