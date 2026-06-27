const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const User = require("../models/User");
const {
  assignPasswordResetToken,
  assignVerificationToken,
  buildClientUrl,
  hashToken,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  VERIFICATION_TOKEN_TTL_HOURS
} = require("../lib/accountTokens");
const { notifyOwner, notifyUser } = require("../lib/resend");

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

async function sendPasswordResetEmail(user, token) {
  const resetUrl = buildClientUrl(`/reset-password?token=${encodeURIComponent(token)}`);

  try {
    return await notifyUser(user.email, "Reset your Travellex password", [
      `Hello ${user.name},`,
      "",
      "We received a request to reset the password for your Travellex account.",
      `Reset password: ${resetUrl}`,
      "",
      `This link expires in ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.`,
      "",
      "Warm regards,",
      "Travellex"
    ]);
  } catch (error) {
    return { sent: false, reason: error.message || "Password reset email could not be sent." };
  }
}

async function sendPasswordChangedEmail(user) {
  try {
    return await notifyUser(user.email, "Your Travellex password was updated", [
      `Hello ${user.name},`,
      "",
      "Your Travellex password was changed successfully.",
      "If you did not make this change, contact Travellex immediately.",
      "",
      "Warm regards,",
      "Travellex"
    ]);
  } catch (error) {
    return { sent: false, reason: error.message || "Password update email could not be sent." };
  }
}

async function sendRegistrationAdminEmail(user, verificationStatus) {
  return notifyOwner(`New Travellex user registration: ${user.name}`, [
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Role: ${normalizeRole(user.role)}`,
    `Country: ${user.country || "Not provided"}`,
    `Email verification: ${verificationStatus?.sent ? "Sent" : verificationStatus?.reason || "Not sent"}`,
    "Status: Waiting for email confirmation",
    `Open: ${buildClientUrl("/admin")}`
  ]);
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
        verificationEmailMessage: verificationStatus.sent ? "Verification email sent. Check your inbox shortly." : verificationStatus.reason
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
  await sendRegistrationAdminEmail(user, verificationStatus);

  sendResponse(res, 201, {
    verificationRequired: true,
    email: user.email,
    verificationEmailSent: verificationStatus.sent,
    verificationEmailMessage: verificationStatus.sent ? "Verification email sent. Check your inbox shortly." : verificationStatus.reason,
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

  if (user.suspended) {
    throw new ApiError(403, "This account is suspended. Contact Travellex support.");
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

  await notifyOwner(`Travellex user email verified: ${user.name}`, [
    `Name: ${user.name}`,
    `Email: ${user.email}`,
    `Role: ${normalizeRole(user.role)}`,
    `Country: ${user.country || "Not provided"}`,
    `Email verified at: ${user.emailVerifiedAt.toISOString()}`
  ]);

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

const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = req.body.email?.toLowerCase();

  if (!email) {
    throw new ApiError(422, "Email is required.");
  }

  const user = await User.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (user) {
    const token = assignPasswordResetToken(user);
    await user.save();
    await sendPasswordResetEmail(user, token);
  }

  sendResponse(res, 200, {
    message: "If this email belongs to a Travellex account, a password reset link will be sent shortly."
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  const { password } = req.body;

  if (!token || !password) {
    throw new ApiError(422, "Reset token and new password are required.");
  }

  if (password.length < 8) {
    throw new ApiError(422, "Password must be at least 8 characters.");
  }

  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() }
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) {
    throw new ApiError(400, "Password reset link is invalid or expired.");
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.emailVerified = true;
  user.emailVerifiedAt = user.emailVerifiedAt || new Date();
  await user.save();

  await sendPasswordChangedEmail(user);

  sendResponse(res, 200, {
    message: "Password reset successful. You can now log in with your new password."
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
  requestPasswordReset,
  resetPassword,
  resendVerification,
  serializeUser,
  verifyEmail
};
