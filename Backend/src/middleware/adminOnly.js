const ApiError = require("../utils/apiError");

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    next(new ApiError(403, "Admin access required."));
    return;
  }

  next();
}

module.exports = adminOnly;
