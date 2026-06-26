const { Resend } = require("resend");

const ownerEmail = "msamilashalom@gmail.com";
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS) || 8000;

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function tourLabel(enquiry) {
  return enquiry.tour?.title || enquiry.destination || "General enquiry";
}

function enquiryLabel(enquiry) {
  if (enquiry.type === "partner_application") {
    return "Tour listing application";
  }

  return enquiry.requestType === "quote" ? `Quote request: ${tourLabel(enquiry)}` : tourLabel(enquiry);
}

function normalizeLines(lines = []) {
  return lines.filter((line) => line !== undefined && line !== null).map((line) => String(line));
}

async function sendEmail({ to, subject, lines }) {
  const resend = getClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  let timeoutId;

  try {
    await Promise.race([
      resend.emails.send({
        from: "Travellex <onboarding@resend.dev>",
        to,
        subject,
        text: normalizeLines(lines).join("\n")
      }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Email provider timed out.")), EMAIL_TIMEOUT_MS);
      })
    ]);

    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error.message || "Email could not be sent." };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function notifyOwner(subject, lines) {
  return sendEmail({ to: ownerEmail, subject, lines });
}

async function notifyUser(to, subject, lines) {
  if (!to) {
    return { sent: false, reason: "Recipient email is missing." };
  }

  return sendEmail({ to, subject, lines });
}

async function notifyMany(recipients, subject, lines) {
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];
  const statuses = await Promise.all(uniqueRecipients.map((to) => notifyUser(to, subject, lines)));
  return { sent: statuses.some((status) => status.sent), recipients: uniqueRecipients, statuses };
}

async function sendEnquiryEmails(enquiry) {
  const resend = getClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  const tourName = tourLabel(enquiry);
  const label = enquiryLabel(enquiry);
  const destination = enquiry.destination || enquiry.tour?.location || "Not provided";
  const partnerName = enquiry.partner?.name || "Not assigned";
  const partnerEmail = enquiry.partner?.contactEmail || "Not provided";
  const requestType = enquiry.requestType === "quote" ? "Quote request" : "Question";
  const confirmationText =
    enquiry.type === "partner_application"
      ? "Travellex has received your tour listing application and will follow up to schedule a discussion."
      : enquiry.requestType === "quote"
        ? "Travellex has received your quote request and will follow up with availability, operator details and next steps."
      : "Travellex has received your travel request and will follow up with the best next step.";

  await Promise.all([
    resend.emails.send({
      from: "Travellex <onboarding@resend.dev>",
      to: ownerEmail,
      subject: `New Travellex enquiry: ${label}`,
      text: [
        `Type: ${enquiry.type || "traveller"}`,
        `Request: ${requestType}`,
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Destination: ${destination}`,
        `Tour: ${tourName}`,
        `Partner: ${partnerName}`,
        `Partner email: ${partnerEmail}`,
        `Travel date: ${enquiry.travelDate ? enquiry.travelDate.toISOString().slice(0, 10) : "Not provided"}`,
        `Group size: ${enquiry.groupSize || "Not provided"}`,
        `Budget EUR: ${enquiry.budgetEUR || "Not provided"}`,
        "",
        enquiry.message || "No message provided."
      ].join("\n")
    }),
    resend.emails.send({
      from: "Travellex <onboarding@resend.dev>",
      to: enquiry.email,
      subject: `We received your Travellex enquiry`,
      text: [
        `Hello ${enquiry.name},`,
        "",
        `Thank you for contacting Travellex about ${label}.`,
        confirmationText,
        "",
        "Warm regards,",
        "Travellex"
      ].join("\n")
    })
  ]);

  return { sent: true };
}

module.exports = {
  notifyMany,
  notifyOwner,
  notifyUser,
  sendEnquiryEmails
};
