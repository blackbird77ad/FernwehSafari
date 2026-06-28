const mongoose = require("mongoose");

const appSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    defaultCommissionRatePercent: {
      type: Number,
      min: [0, "Commission rate must be positive."],
      max: [100, "Commission rate cannot exceed 100%."],
      default: 0
    },
    commissionTerms: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppSetting", appSettingSchema);
