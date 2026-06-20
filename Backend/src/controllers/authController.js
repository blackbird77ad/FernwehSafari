const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const User = require("../models/User");
const { notifyOwner } = require("../lib/resend");

function normalizeRole(role) {
  return role === "user" ? User.DEFAULT_ROLE : role;
}

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: normalizeRole(user.role)
    },
    process.env.JWT_SECRET || "development-secret-change-me",
    { expiresIn: "7d" }
  );
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    country: user.country,
    savedTours: user.savedTours || []
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, country } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(422, "Name, email and password are required.");
  }

  if (password.length < 8) {
    throw new ApiError(422, "Password must be at least 8 characters.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "An account already exists for this email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    country
  });

  await notifyOwner(`New FernwehSafari user registered: ${user.name}`, [
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Role: ${normalizeRole(user.role)}`,
    `Country: ${user.country || "Not provided"}`
  ]);

  sendResponse(res, 201, {
    token: signToken(user),
    user: serializeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(422, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  sendResponse(res, 200, {
    token: signToken(user),
    user: serializeUser(user)
  });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-passwordHash")
    .populate({
      path: "savedTours",
      populate: { path: "partner" }
    });

  sendResponse(res, 200, { user: serializeUser(user) });
});

module.exports = {
  login,
  me,
  register,
  serializeUser
};
