const ApiError = require("../utils/apiError");
const asyncHandler = require("../utils/asyncHandler");
const sendResponse = require("../utils/sendResponse");
const Enquiry = require("../models/Enquiry");
const Tour = require("../models/Tour");
const TourPartner = require("../models/TourPartner");
const { notifyOwner, notifyUser, sendEnquiryEmails } = require("../lib/resend");

const clientUrl = (process.env.CLIENT_URL || "https://travellex.tours").replace(/\/+$/, "");
const PARTNER_THREAD_DIRECTIONS = ["admin_to_partner", "partner_to_admin"];

function normalizeMessage(value) {
  return String(value || "").trim();
}

function isStaff(user) {
  return user?.role === "admin" || user?.role === "moderator";
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAttachments(value) {
  if (!Array.isArray(value)) {
    return normalizeList(value).map((url) => ({ url }));
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return { url: item.trim() };
      }

      return {
        name: String(item?.name || "").trim(),
        url: String(item?.url || "").trim(),
        mediaType: String(item?.mediaType || "").trim()
      };
    })
    .filter((item) => item.url);
}

function normalizeAnswers(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => ({
      question: String(item?.question || "").trim(),
      answer: String(item?.answer || "").trim()
    }))
    .filter((item) => item.question || item.answer);
}

function hasCommunicationContent({ message, questions, attachments, answers }) {
  return Boolean(
    normalizeMessage(message) ||
      (questions || []).length ||
      (attachments || []).length ||
      (answers || []).some((item) => item.question || item.answer)
  );
}

function attachmentLines(attachments = []) {
  if (!attachments.length) {
    return [];
  }

  return ["", "Attachments", ...attachments.map((item) => `${item.name || "File"}: ${item.url}`)];
}

function questionLines(questions = []) {
  if (!questions.length) {
    return [];
  }

  return ["", "Questions", ...questions.map((question, index) => `${index + 1}. ${question}`)];
}

function answerLines(answers = []) {
  if (!answers.length) {
    return [];
  }

  return [
    "",
    "Partner answers",
    ...answers.flatMap((item, index) => [
      `${index + 1}. ${item.question || "Question"}`,
      item.answer || "No answer provided."
    ])
  ];
}

function sanitizeTourForPartner(tour) {
  if (!tour) {
    return null;
  }

  return {
    _id: tour._id,
    title: tour.title,
    slug: tour.slug,
    location: tour.location,
    category: tour.category,
    duration: tour.duration,
    priceEUR: tour.priceEUR,
    priceBasis: tour.priceBasis,
    groupSizeMin: tour.groupSizeMin,
    groupSizeMax: tour.groupSizeMax,
    minimumAge: tour.minimumAge,
    confirmationType: tour.confirmationType
  };
}

function serializeEnquiryForPartner(enquiry) {
  const data = enquiry.toObject ? enquiry.toObject() : enquiry;

  return {
    _id: data._id,
    status: data.status,
    requestType: data.requestType,
    type: data.type,
    destination: data.destination || data.tour?.location,
    tour: sanitizeTourForPartner(data.tour),
    partner: data.partner
      ? {
          _id: data.partner._id,
          name: data.partner.name
        }
      : null,
    communications: (data.communications || []).filter((item) => PARTNER_THREAD_DIRECTIONS.includes(item.direction)),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

async function findOwnedPartner(userId) {
  return TourPartner.findOne({ ownerUser: userId, isActive: true });
}

const createEnquiry = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    destination,
    message,
    tour: tourId,
    type = "traveller",
    requestType = "question",
    travelDate,
    groupSize,
    budgetEUR
  } = req.body;

  if (!name || !email) {
    throw new ApiError(422, "Name and email are required.");
  }

  let tour = null;

  if (tourId) {
    tour = await Tour.findById(tourId).populate("partner");

    if (!tour) {
      throw new ApiError(404, "Tour not found.");
    }
  }

  const readableMessage = normalizeMessage(message);

  const enquiry = await Enquiry.create({
    user: req.user?._id,
    name,
    email,
    tour: tour?._id,
    partner: tour?.partner?._id,
    destination,
    message: readableMessage,
    type,
    requestType,
    travelDate: travelDate || undefined,
    groupSize: groupSize === "" || groupSize === undefined ? undefined : Number(groupSize),
    budgetEUR: budgetEUR === "" || budgetEUR === undefined ? undefined : Number(budgetEUR)
  });
  await enquiry.populate(["tour", "partner", "user", "referral"]);

  const emailStatus = await sendEnquiryEmails(enquiry, {
    notifyTraveller: requestType !== "quote" && requestType !== "booking"
  });
  sendResponse(res, 201, { enquiry, emailStatus });
});

const listEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find()
    .populate(["tour", "partner", "user", "referral"])
    .populate("communications.sentBy", "name email role")
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { enquiries });
});

const listMyEnquiries = asyncHandler(async (req, res) => {
  const enquiries = await Enquiry.find({ user: req.user._id, isArchived: { $ne: true } })
    .populate(["tour", "partner", "referral"])
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { enquiries });
});

const listPartnerEnquiries = asyncHandler(async (req, res) => {
  const partner = await findOwnedPartner(req.user._id);

  if (!partner) {
    sendResponse(res, 200, { enquiries: [] });
    return;
  }

  const enquiries = await Enquiry.find({
    partner: partner._id,
    isArchived: { $ne: true },
    "communications.direction": { $in: PARTNER_THREAD_DIRECTIONS }
  })
    .populate(["tour", "partner"])
    .populate("communications.sentBy", "name role")
    .sort({ updatedAt: -1 });

  sendResponse(res, 200, { enquiries: enquiries.map(serializeEnquiryForPartner) });
});

const updateEnquiryStatus = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  ).populate(["tour", "partner", "user", "referral"]);

  if (!enquiry) {
    throw new ApiError(404, "Enquiry not found.");
  }

  sendResponse(res, 200, { enquiry });
});

const archiveEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).populate(["tour", "partner", "user", "referral"]);

  if (!enquiry) {
    throw new ApiError(404, "Enquiry not found.");
  }

  const archived = req.body.archived !== false;
  enquiry.isArchived = archived;
  enquiry.archivedAt = archived ? new Date() : undefined;
  enquiry.archivedBy = archived ? req.user._id : undefined;
  enquiry.archiveReason = archived ? req.body.reason || req.body.archiveReason || enquiry.archiveReason : undefined;
  await enquiry.save();

  sendResponse(res, 200, { enquiry });
});

const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    throw new ApiError(404, "Enquiry not found.");
  }

  await Enquiry.findByIdAndDelete(req.params.id);

  sendResponse(res, 200, { id: req.params.id });
});

const sendAdminEnquiryMessage = asyncHandler(async (req, res) => {
  if (!isStaff(req.user)) {
    throw new ApiError(403, "Admin or moderator access required.");
  }

  const recipient = req.body.recipient;

  if (!["partner", "traveller"].includes(recipient)) {
    throw new ApiError(422, "Recipient must be partner or traveller.");
  }

  const subject = normalizeMessage(req.body.subject) || `Travellex follow-up: ${req.body.title || "Tour request"}`;
  const message = normalizeMessage(req.body.message);
  const questions = normalizeList(req.body.questions);
  const attachments = normalizeAttachments(req.body.attachments);

  if (!hasCommunicationContent({ message, questions, attachments })) {
    throw new ApiError(422, "Add a message, question or attachment before sending.");
  }

  const enquiry = await Enquiry.findById(req.params.id).populate(["tour", "partner", "user", "referral"]);

  if (!enquiry) {
    throw new ApiError(404, "Enquiry not found.");
  }

  const to = recipient === "partner" ? enquiry.partner?.contactEmail : enquiry.email;

  if (!to) {
    throw new ApiError(422, `${recipient === "partner" ? "Partner" : "Traveller"} email is missing.`);
  }

  const communication = {
    direction: recipient === "partner" ? "admin_to_partner" : "admin_to_traveller",
    recipientRole: recipient,
    subject,
    message,
    questions,
    attachments,
    sentBy: req.user._id,
    sentAt: new Date()
  };

  enquiry.communications.push(communication);

  if (recipient === "partner" && ["received", "admin_review", "new", "contacted"].includes(enquiry.status)) {
    enquiry.status = "partner_follow_up";
  }

  if (recipient === "traveller" && ["partner_replied", "partner_follow_up", "admin_review", "received", "new", "contacted", "referred"].includes(enquiry.status)) {
    enquiry.status = "details_shared";
  }

  await enquiry.save();

  const emailStatus = await notifyUser(
    to,
    subject,
    recipient === "partner"
      ? [
          `Hello ${enquiry.partner?.name || "partner"},`,
          "",
          `Travellex needs your input for ${enquiry.tour?.title || enquiry.destination || "a tour request"}.`,
          "No traveller contact details are shared. Please reply in your Travellex dashboard or reply to this email so Travellex admin can continue the traveller follow-up.",
          "",
          "Message",
          message || "No message provided.",
          ...questionLines(questions),
          ...attachmentLines(attachments),
          "",
          `Open partner dashboard: ${clientUrl}/dashboard`
        ]
      : [
          `Hello ${enquiry.name || "traveller"},`,
          "",
          `Travellex has an update for ${enquiry.tour?.title || enquiry.destination || "your request"}.`,
          "",
          message || "No message provided.",
          ...attachmentLines(attachments),
          "",
          "Travellex"
        ],
    {
      preheader: message || subject,
      cta: recipient === "partner" ? { label: "Open dashboard", href: `${clientUrl}/dashboard` } : undefined
    }
  );

  await enquiry.populate(["tour", "partner", "user", "referral"]);
  await enquiry.populate("communications.sentBy", "name email role");
  sendResponse(res, 201, { enquiry, emailStatus });
});

const createPartnerEnquiryReply = asyncHandler(async (req, res) => {
  if (req.user.role !== "tour_company") {
    throw new ApiError(403, "Partner account required.");
  }

  const partner = await findOwnedPartner(req.user._id);

  if (!partner) {
    throw new ApiError(403, "Approved partner account required.");
  }

  const enquiry = await Enquiry.findOne({ _id: req.params.id, partner: partner._id }).populate(["tour", "partner"]);

  if (!enquiry) {
    throw new ApiError(404, "Follow-up not found.");
  }

  const hasAdminFollowUp = (enquiry.communications || []).some((item) => item.direction === "admin_to_partner");

  if (!hasAdminFollowUp) {
    throw new ApiError(403, "Travellex admin must open a partner follow-up before you can reply.");
  }

  const subject = normalizeMessage(req.body.subject) || `Partner reply: ${enquiry.tour?.title || enquiry.destination || "Tour request"}`;
  const message = normalizeMessage(req.body.message);
  const answers = normalizeAnswers(req.body.answers);
  const attachments = normalizeAttachments(req.body.attachments);

  if (!hasCommunicationContent({ message, answers, attachments })) {
    throw new ApiError(422, "Add an answer, message or attachment before sending.");
  }

  enquiry.communications.push({
    direction: "partner_to_admin",
    recipientRole: "admin",
    subject,
    message,
    answers,
    attachments,
    sentBy: req.user._id,
    sentAt: new Date()
  });
  enquiry.status = "partner_replied";
  await enquiry.save();

  const emailStatus = await notifyOwner(subject, [
    `Partner: ${partner.name}`,
    `Tour: ${enquiry.tour?.title || enquiry.destination || "Not provided"}`,
    `Enquiry ID: ${enquiry._id}`,
    "",
    "Partner message",
    message || "No message provided.",
    ...answerLines(answers),
    ...attachmentLines(attachments),
    "",
    `Open admin portal: ${clientUrl}/admin`
  ]);

  await enquiry.populate("communications.sentBy", "name role");
  sendResponse(res, 201, { enquiry: serializeEnquiryForPartner(enquiry), emailStatus });
});

module.exports = {
  archiveEnquiry,
  createPartnerEnquiryReply,
  createEnquiry,
  deleteEnquiry,
  listPartnerEnquiries,
  listEnquiries,
  listMyEnquiries,
  sendAdminEnquiryMessage,
  updateEnquiryStatus
};
