const mongoose = require("mongoose");

const ENQUIRY_STATUSES = [
  "received",
  "admin_review",
  "partner_follow_up",
  "partner_replied",
  "details_shared",
  "quote_sent",
  "payment_pending",
  "paid",
  "booked",
  "completed",
  "closed",
  "cancelled",
  "new",
  "contacted",
  "referred"
];

const ENQUIRY_MESSAGE_DIRECTIONS = [
  "admin_to_partner",
  "partner_to_admin",
  "admin_to_traveller",
  "traveller_to_admin",
  "internal_note"
];

const attachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      required: [true, "Attachment URL is required."],
      trim: true
    },
    mediaType: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      trim: true
    },
    answer: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const enquiryCommunicationSchema = new mongoose.Schema(
  {
    direction: {
      type: String,
      enum: ENQUIRY_MESSAGE_DIRECTIONS,
      required: true
    },
    recipientRole: {
      type: String,
      enum: ["admin", "partner", "traveller"],
      required: true
    },
    subject: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    questions: {
      type: [String],
      default: []
    },
    answers: {
      type: [answerSchema],
      default: []
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const enquirySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      lowercase: true,
      trim: true
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour"
    },
    referral: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Referral"
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourPartner"
    },
    destination: {
      type: String,
      trim: true
    },
    message: {
      type: String,
      trim: true
    },
    requestType: {
      type: String,
      enum: ["question", "quote", "booking"],
      default: "question"
    },
    travelDate: {
      type: Date
    },
    groupSize: {
      type: Number,
      min: [1, "Group size must be at least 1."]
    },
    budgetEUR: {
      type: Number,
      min: [0, "Budget must be positive."]
    },
    type: {
      type: String,
      enum: ["traveller", "partner_application"],
      default: "traveller"
    },
    status: {
      type: String,
      enum: ENQUIRY_STATUSES,
      default: "received"
    },
    communications: {
      type: [enquiryCommunicationSchema],
      default: []
    },
    adminNotes: {
      type: String,
      trim: true
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedAt: {
      type: Date
    },
    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    archiveReason: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
module.exports.ENQUIRY_STATUSES = ENQUIRY_STATUSES;
module.exports.ENQUIRY_MESSAGE_DIRECTIONS = ENQUIRY_MESSAGE_DIRECTIONS;
