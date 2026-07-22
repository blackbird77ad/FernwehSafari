const bcrypt = require("bcryptjs");
const crypto = require("node:crypto");
const ApiError = require("../utils/apiError");
const TourPartner = require("../models/TourPartner");
const User = require("../models/User");
const {
  assignPasswordResetToken,
  buildClientUrl,
  PASSWORD_RESET_TOKEN_TTL_MINUTES
} = require("./accountTokens");
const { notifyUser } = require("./resend");

function randomAccountPassword() {
  return crypto.randomBytes(32).toString("hex");
}

function normalizePartnerEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function ensureTourCompanyAccount({ beforeSave, country = "", email, name }) {
  const normalizedEmail = normalizePartnerEmail(email);

  if (!normalizedEmail) {
    throw new ApiError(422, "A partner contact email is required so the approved company can log in and add listings.");
  }

  let user = await User.findOne({ email: normalizedEmail }).select(
    "+emailVerificationTokenHash +emailVerificationExpiresAt +passwordResetTokenHash +passwordResetExpiresAt"
  );
  let setupPasswordUrl = "";
  let accountCreated = false;

  if (!user) {
    user = new User({
      name: name || normalizedEmail,
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(randomAccountPassword(), 12),
      country,
      role: "tour_company",
      emailVerified: true,
      emailVerifiedAt: new Date()
    });
    const setupToken = assignPasswordResetToken(user);
    setupPasswordUrl = buildClientUrl(`/reset-password?token=${encodeURIComponent(setupToken)}`);
    accountCreated = true;
  } else {
    user.role = "tour_company";
    user.suspended = false;
    user.emailVerified = true;
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;

    if (name && (!user.name || user.name === user.email)) {
      user.name = name;
    }

    if (country && !user.country) {
      user.country = country;
    }
  }

  if (beforeSave) {
    await beforeSave(user, { accountCreated });
  }

  await user.save();

  return { accountCreated, setupPasswordUrl, user };
}

async function notifyApprovedPartnerAccount({ accountCreated, contactName, partnerName, setupPasswordUrl, user }) {
  const loginUrl = buildClientUrl("/login");
  const displayName = contactName || user.name || partnerName || "partner";
  const emailStatus = await notifyUser(
    user.email,
    "Travellex partner account approved",
    [
      `Hello ${displayName},`,
      "",
      `${partnerName || "Your tour company"} is approved on Travellex.`,
      "Your partner account can add and manage tour listings straight away.",
      accountCreated ? `Set password: ${setupPasswordUrl}` : `Login: ${loginUrl}`,
      accountCreated
        ? `This password setup link expires in ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutes. If it expires, use Forgot password on the login page.`
        : "Use your existing Travellex login. If you do not remember your password, use Forgot password on the login page.",
      "",
      "Travellex"
    ],
    {
      cta: accountCreated
        ? { label: "Set password", href: setupPasswordUrl }
        : { label: "Login", href: loginUrl }
    }
  );

  return emailStatus;
}

async function createApprovedPartnerFromAdmin(payload) {
  const account = await ensureTourCompanyAccount({
    beforeSave: async (user) => {
      const existingPartner = await TourPartner.findOne({ ownerUser: user._id });

      if (existingPartner) {
        throw new ApiError(
          409,
          "This contact email already owns an approved partner account. Edit that partner or use another contact email."
        );
      }
    },
    country: payload.location,
    email: payload.contactEmail,
    name: payload.name
  });

  const partner = await TourPartner.create({
    ...payload,
    contactEmail: normalizePartnerEmail(payload.contactEmail),
    ownerUser: account.user._id,
    isActive: payload.isActive !== false
  });
  const emailStatus = await notifyApprovedPartnerAccount({
    ...account,
    partnerName: partner.name
  });

  return { ...account, emailStatus, partner };
}

async function approveCompanyApplication(application, adminUser, reviewNotes) {
  const account = await ensureTourCompanyAccount({
    country: application.headquarters,
    email: application.email,
    name: application.contactName
  });
  const partnerPayload = {
    name: application.companyName,
    bookingURL: application.bookingURL || application.website || "",
    location: application.headquarters,
    contactEmail: normalizePartnerEmail(application.email),
    contactPhone: application.whatsapp || application.phone,
    description: application.notes || `${application.companyName} tour company profile.`,
    commissionTerms: application.commissionExpectation,
    ownerUser: account.user._id,
    application: application._id,
    isActive: true
  };
  const partner =
    (await TourPartner.findOneAndUpdate({ ownerUser: account.user._id }, partnerPayload, {
      new: true,
      runValidators: true
    })) || (await TourPartner.create(partnerPayload));

  application.status = "approved";
  application.reviewNotes = reviewNotes;
  application.reviewedBy = adminUser._id;
  application.reviewedAt = new Date();
  application.linkedUser = account.user._id;
  application.partner = partner._id;
  await application.save();

  const emailStatus = await notifyApprovedPartnerAccount({
    ...account,
    contactName: application.contactName,
    partnerName: application.companyName
  });

  return { accountCreated: account.accountCreated, application, emailStatus, partner, user: account.user };
}

module.exports = {
  approveCompanyApplication,
  createApprovedPartnerFromAdmin,
  ensureTourCompanyAccount,
  normalizePartnerEmail
};
