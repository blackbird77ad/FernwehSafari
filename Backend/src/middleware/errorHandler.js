function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || (error.name === "ValidationError" ? 422 : 500);
  const message =
    error.name === "ValidationError"
      ? Object.values(error.errors).map((item) => item.message).join(" ")
      : error.message || "Unexpected server error.";

  res.status(statusCode).json({
    success: false,
    message
  });
}

module.exports = errorHandler;
