const PUBLIC_PARTNER_SELECT = "name location description rating reviewCount licenseInfo logo isActive";

const PUBLIC_PARTNER_FIELDS = [
  "_id",
  "name",
  "location",
  "description",
  "rating",
  "reviewCount",
  "licenseInfo",
  "logo",
  "isActive"
];

function toPlain(document) {
  return document?.toObject ? document.toObject() : document;
}

function pickFields(data, fields) {
  return fields.reduce((result, field) => {
    if (data[field] !== undefined) {
      result[field] = data[field];
    }

    return result;
  }, {});
}

function serializePublicPartner(partner) {
  const data = toPlain(partner);

  if (!data) {
    return null;
  }

  return pickFields(data, PUBLIC_PARTNER_FIELDS);
}

function serializePublicTour(tour) {
  const data = toPlain(tour);

  if (!data) {
    return null;
  }

  const { commissionRatePercent, owner, referralLink, ...safeTour } = data;

  if (safeTour.partner && typeof safeTour.partner === "object") {
    safeTour.partner = serializePublicPartner(safeTour.partner);
  }

  return safeTour;
}

function serializeTravellerReferral(referral) {
  const data = toPlain(referral);

  if (!data) {
    return null;
  }

  return {
    _id: data._id,
    trackingCode: data.trackingCode,
    status: data.status,
    converted: data.converted,
    clickedAt: data.clickedAt,
    hasExternalBooking: false,
    tour: serializePublicTour(data.tour),
    partner: serializePublicPartner(data.partner)
  };
}

function serializeTravellerEnquiry(enquiry) {
  const data = toPlain(enquiry);

  if (!data) {
    return null;
  }

  return {
    ...data,
    adminNotes: undefined,
    communications: (data.communications || []).filter((item) =>
      ["admin_to_traveller", "traveller_to_admin"].includes(item.direction)
    ),
    partner: serializePublicPartner(data.partner),
    tour: serializePublicTour(data.tour)
  };
}

module.exports = {
  PUBLIC_PARTNER_SELECT,
  serializePublicPartner,
  serializePublicTour,
  serializeTravellerEnquiry,
  serializeTravellerReferral
};
