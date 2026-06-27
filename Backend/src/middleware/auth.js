const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");
const User = require("../models/User");

function getToken(req) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length);
}

async function attachUser(req, tokenRequired) {
  const token = getToken(req);

  if (!token) {
    if (tokenRequired) {
      throw new ApiError(401, "Authentication required.");
    }

    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "development-secret-change-me");
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user && tokenRequired) {
      throw new ApiError(401, "User no longer exists.");
    }

    if (user?.suspended && tokenRequired) {
      throw new ApiError(403, "This account is suspended. Contact Travellex support.");
    }

    req.user = user || null;
  } catch (error) {
    if (tokenRequired) {
      throw new ApiError(401, "Invalid or expired token.");
    }
  }
}

async function auth(req, res, next) {
  try {
    await attachUser(req, true);
    next();
  } catch (error) {
    next(error);
  }
}

async function optionalAuth(req, res, next) {
  try {
    await attachUser(req, false);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  auth,
  optionalAuth
};
