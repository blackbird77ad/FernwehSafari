const mongoose = require("mongoose");

const USER_ROLES = ["traveller", "tour_company", "tour_guide", "moderator", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required."]
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: "traveller"
    },
    savedTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour"
      }
    ],
    country: {
      type: String,
      trim: true
    },
    suspended: {
      type: Boolean,
      default: false
    },
    emailVerified: {
      type: Boolean,
      default: true
    },
    emailVerifiedAt: {
      type: Date
    },
    emailVerificationTokenHash: {
      type: String,
      select: false
    },
    emailVerificationExpiresAt: {
      type: Date,
      select: false
    },
    passwordResetTokenHash: {
      type: String,
      select: false
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

userSchema.pre("validate", function normalizeLegacyRole(next) {
  if (this.role === "user") {
    this.role = "traveller";
  }

  next();
});

const User = mongoose.model("User", userSchema);

User.USER_ROLES = USER_ROLES;
User.DEFAULT_ROLE = "traveller";

module.exports = User;
