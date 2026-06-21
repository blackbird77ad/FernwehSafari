const ApiError = require("../utils/apiError");

function staffOnly(req, res, next) {
  if (!req.user || !["admin", "moderator"].includes(req.user.role)) {
    next(new ApiError(403, "Admin or moderator access required."));
    return;
  }

  next();
}

module.exports = staffOnly;
