const AppSetting = require("../models/AppSetting");

const COMMISSION_SETTINGS_KEY = "commission";

function normalizeCommissionRate(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, 0), 100);
}

async function getCommissionSettings() {
  const settings = await AppSetting.findOneAndUpdate(
    { key: COMMISSION_SETTINGS_KEY },
    { $setOnInsert: { key: COMMISSION_SETTINGS_KEY, defaultCommissionRatePercent: 0, commissionTerms: "" } },
    { new: true, upsert: true, runValidators: true }
  );

  return settings;
}

module.exports = {
  getCommissionSettings,
  normalizeCommissionRate
};
