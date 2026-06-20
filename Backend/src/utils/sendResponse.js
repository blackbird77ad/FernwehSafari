function sendResponse(res, statusCode, data) {
  res.status(statusCode).json({
    success: true,
    data
  });
}

module.exports = sendResponse;
