const express = require("express");
const {
  login,
  me,
  register,
  requestPasswordReset,
  resetPassword,
  resendVerification,
  verifyEmail
} = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.get("/me", auth, me);

module.exports = router;
