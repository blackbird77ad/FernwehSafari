const { Resend } = require("resend");

const ownerEmail = "msamilashalom@gmail.com";

function getClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }

  return new Resend(process.env.RESEND_API_KEY);
}

function tourLabel(enquiry) {
  return enquiry.tour?.title || "General enquiry";
}

async function sendEnquiryEmails(enquiry) {
  const resend = getClient();

  if (!resend) {
    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  const tourName = tourLabel(enquiry);
  const partnerName = enquiry.partner?.name || "Not assigned";
  const partnerEmail = enquiry.partner?.contactEmail || "Not provided";

  await Promise.all([
    resend.emails.send({
      from: "FernwehSafari <onboarding@resend.dev>",
      to: ownerEmail,
      subject: `New FernwehSafari enquiry: ${tourName}`,
      text: [
        `Customer: ${enquiry.name}`,
        `Email: ${enquiry.email}`,
        `Tour: ${tourName}`,
        `Partner: ${partnerName}`,
        `Partner email: ${partnerEmail}`,
        "",
        enquiry.message || "No message provided."
      ].join("\n")
    }),
    resend.emails.send({
      from: "FernwehSafari <onboarding@resend.dev>",
      to: enquiry.email,
      subject: `We received your FernwehSafari enquiry`,
      text: [
        `Hello ${enquiry.name},`,
        "",
        `Thank you for enquiring about ${tourName}.`,
        "FernwehSafari has received your request and will connect you with the relevant tour partner.",
        "",
        "Warm regards,",
        "FernwehSafari"
      ].join("\n")
    })
  ]);

  return { sent: true };
}

module.exports = {
  sendEnquiryEmails
};
