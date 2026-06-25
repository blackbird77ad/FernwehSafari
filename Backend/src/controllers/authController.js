const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const User = require("../models/User");
const { notifyOwner, notifyUser } = require("../lib/resend");

const VERIFICATION_TOKEN_TTL_HOURS = 24;

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
    emailVerified: user.emailVerified !== false,
    role: normalizeRole(user.role),
    country: user.country,
    savedTours: user.savedTours || []
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildClientUrl(path) {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
  return `${clientUrl}${path}`;
}

function createVerificationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function assignVerificationToken(user) {
  const token = createVerificationToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  return token;
}

async function sendVerificationEmail(user, token) {
  const verificationUrl = buildClientUrl(`/verify-email?token=${encodeURIComponent(token)}`);

  try {
    return await notifyUser(user.email, "Confirm your Travellex email", [
      `Hello ${user.name},`,
      "",
      "Please confirm your email address to activate your Travellex account.",
      `Confirm email: ${verificationUrl}`,
      "",
      `This link expires in ${VERIFICATION_TOKEN_TTL_HOURS} hours.`,
      "",
      "Warm regards,",
      "Travellex"
    ]);
  } catch (error) {
    return { sent: false, reason: error.message || "Verification email could not be sent." };
  }
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
    if (existingUser.emailVerified === false) {
      const token = assignVerificationToken(existingUser);
      await existingUser.save();
      const verificationStatus = await sendVerificationEmail(existingUser, token);

      sendResponse(res, 200, {
        verificationRequired: true,
        email: existingUser.email,
        verificationEmailSent: verificationStatus.sent,
        verificationEmailMessage: verificationStatus.sent ? "Verification email resent." : verificationStatus.reason
      });
      return;
    }

    throw new ApiError(409, "An account already exists for this email.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = new User({
    name,
    email,
    passwordHash,
    country,
    emailVerified: false
  });
  const verificationToken = assignVerificationToken(user);
  await user.save();
  const verificationStatus = await sendVerificationEmail(user, verificationToken);

  await notifyOwner(`New Travellex user registered: ${user.name}`, [
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Role: ${normalizeRole(user.role)}`,
    `Country: ${user.country || "Not provided"}`
  ]).catch(() => null);

  sendResponse(res, 201, {
    verificationRequired: true,
    email: user.email,
    verificationEmailSent: verificationStatus.sent,
    verificationEmailMessage: verificationStatus.sent ? "Verification email sent." : verificationStatus.reason,
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

  if (user.emailVerified === false) {
    throw new ApiError(403, "Please verify your email before logging in.");
  }

  sendResponse(res, 200, {
    token: signToken(user),
    user: serializeUser(user)
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token || req.params.token;

  if (!token) {
    throw new ApiError(422, "Verification token is required.");
  }

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() }
  }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

  if (!user) {
    throw new ApiError(400, "Verification link is invalid or expired.");
  }

  user.emailVerified = true;
  user.emailVerifiedAt = new Date();
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save();

  sendResponse(res, 200, {
    token: signToken(user),
    user: serializeUser(user),
    message: "Email verified."
  });
});

const resendVerification = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase();

  if (!email) {
    throw new ApiError(422, "Email is required.");
  }

  const user = await User.findOne({ email }).select("+emailVerificationTokenHash +emailVerificationExpiresAt");

  if (!user || user.emailVerified !== false) {
    sendResponse(res, 200, {
      verificationRequired: false,
      message: "If this email needs verification, a new link will be sent."
    });
    return;
  }

  const token = assignVerificationToken(user);
  await user.save();
  const verificationStatus = await sendVerificationEmail(user, token);

  sendResponse(res, 200, {
    verificationRequired: true,
    email: user.email,
    verificationEmailSent: verificationStatus.sent,
    verificationEmailMessage: verificationStatus.sent ? "Verification email sent." : verificationStatus.reason
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
  resendVerification,
  serializeUser,
  verifyEmail
};
