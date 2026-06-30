const crypto = require("node:crypto");

const VERIFICATION_TOKEN_TTL_HOURS = 24;
const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function buildClientUrl(path) {
  const configuredClientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
  const isLocalClientUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configuredClientUrl);
  const clientUrl = process.env.NODE_ENV === "production" && isLocalClientUrl ? "https://travellex.tours" : configuredClientUrl;

  return `${clientUrl}${path}`;
}

function createSecureToken() {
  return crypto.randomBytes(32).toString("hex");
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function assignVerificationToken(user) {
  const token = createSecureToken();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);
  return token;
}

function assignVerificationCredentials(user) {
  const token = assignVerificationToken(user);
  const code = createVerificationCode();

  user.emailVerificationCodeHash = hashToken(code);
  user.emailVerificationCodeExpiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000);

  return { token, code };
}

function assignPasswordResetToken(user) {
  const token = createSecureToken();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000);
  return token;
}

module.exports = {
  assignPasswordResetToken,
  assignVerificationCredentials,
  assignVerificationToken,
  buildClientUrl,
  hashToken,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  VERIFICATION_TOKEN_TTL_HOURS
};
