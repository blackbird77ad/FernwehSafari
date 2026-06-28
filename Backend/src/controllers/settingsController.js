const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const TourPartner = require("../models/TourPartner");
const { getCommissionSettings, normalizeCommissionRate } = require("../lib/commissionSettings");

function serializeCommissionSettings(settings) {
  return {
    defaultCommissionRatePercent: settings.defaultCommissionRatePercent || 0,
    commissionTerms: settings.commissionTerms || "",
    updatedAt: settings.updatedAt
  };
}

const getCommissionSettingsForAdmin = asyncHandler(async (req, res) => {
  const settings = await getCommissionSettings();

  sendResponse(res, 200, { settings: serializeCommissionSettings(settings) });
});

const updateCommissionSettingsForAdmin = asyncHandler(async (req, res) => {
  const settings = await getCommissionSettings();
  const defaultCommissionRatePercent = normalizeCommissionRate(req.body.defaultCommissionRatePercent, settings.defaultCommissionRatePercent);
  const commissionTerms = req.body.commissionTerms !== undefined ? String(req.body.commissionTerms).trim() : settings.commissionTerms || "";

  settings.defaultCommissionRatePercent = defaultCommissionRatePercent;
  settings.commissionTerms = commissionTerms;
  await settings.save();

  const partnerUpdate = {
    commissionRatePercent: defaultCommissionRatePercent
  };

  if (commissionTerms) {
    partnerUpdate.commissionTerms = commissionTerms;
  }

  const partnerResult = await TourPartner.updateMany({}, partnerUpdate);

  sendResponse(res, 200, {
    settings: serializeCommissionSettings(settings),
    partnersUpdated: partnerResult.modifiedCount || 0
  });
});

module.exports = {
  getCommissionSettingsForAdmin,
  updateCommissionSettingsForAdmin
};
