const { Resend } = require("resend");

const ownerEmail = "msamilashalom@gmail.com";

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
  return enquiry.type === "partner_application" ? "Tour listing application" : tourLabel(enquiry);
}

function normalizeLines(lines = []) {
  return lines.filter((line) => line !== undefined && line !== null).map((line) => String(line));
}

async function sendEmail({ to, subject, lines }) {
  const resend = getClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  await resend.emails.send({
    from: "Travellex <onboarding@resend.dev>",
    to,
    subject,
    text: normalizeLines(lines).join("\n")
  });

  return { sent: true };
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
  const confirmationText =
    enquiry.type === "partner_application"
      ? "Travellex has received your tour listing application and will follow up to schedule a discussion."
      : "Travellex has received your travel request and will follow up with the best next step.";

  await Promise.all([
    resend.emails.send({
      from: "Travellex <onboarding@resend.dev>",
      to: ownerEmail,
      subject: `New Travellex enquiry: ${label}`,
      text: [
        `Type: ${enquiry.type || "traveller"}`,
        `Name: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Destination: ${destination}`,
        `Tour: ${tourName}`,
        `Partner: ${partnerName}`,
        `Partner email: ${partnerEmail}`,
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
