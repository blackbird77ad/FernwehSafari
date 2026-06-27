const { Resend } = require("resend");

const defaultAdminNotificationEmails = [
  "blackbird77ad@gmail.com",
  "msamilashalom@gmail.com",
  "experience@travellex.tours"
];
const adminNotificationEmails = parseEmailList(process.env.ADMIN_NOTIFICATION_EMAILS, defaultAdminNotificationEmails);
const publicContactEmail = displayEmailAddress(
  process.env.PUBLIC_CONTACT_EMAIL || process.env.RESEND_REPLY_TO,
  "experience@travellex.tours"
);
const resendFromEmail = process.env.RESEND_FROM_EMAIL || `Travellex <${publicContactEmail}>`;
const resendReplyTo = process.env.RESEND_REPLY_TO || publicContactEmail;
const emailLogoUrl = process.env.EMAIL_LOGO_URL || "";
const clientUrl = (process.env.CLIENT_URL || "https://travellex.tours").replace(/\/+$/, "");
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS) || 8000;
let missingResendKeyLogged = false;

function parseEmailList(value, fallback = []) {
  const emails = String(value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(emails.length ? emails : fallback)];
}

function displayEmailAddress(value, fallback) {
  const firstValue = String(value || "")
    .split(",")[0]
    .trim();
  const emailMatch = firstValue.match(/<([^>]+)>/);

  return (emailMatch ? emailMatch[1].trim() : firstValue) || fallback;
}

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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function linkify(value = "") {
  const text = String(value);
  const urlPattern = /https?:\/\/[^\s<]+/g;
  let html = "";
  let lastIndex = 0;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    const rawUrl = match[0];
    const cleanUrl = rawUrl.replace(/[),.]+$/, "");
    const trailing = rawUrl.slice(cleanUrl.length);

    html += escapeHtml(text.slice(lastIndex, match.index));
    html += `<a href="${escapeAttribute(cleanUrl)}" style="color:#0f766e;text-decoration:underline;">${escapeHtml(cleanUrl)}</a>${escapeHtml(trailing)}`;
    lastIndex = match.index + rawUrl.length;
  }

  html += escapeHtml(text.slice(lastIndex));
  return html;
}

function keyValueLine(line) {
  const match = String(line).match(/^([^:\n]{2,54}):\s*(.*)$/);

  if (!match || /^https?$/i.test(match[1])) {
    return null;
  }

  return {
    label: match[1].trim(),
    value: match[2].trim()
  };
}

function groupLines(lines) {
  const groups = [];
  let current = [];

  lines.forEach((line) => {
    if (!String(line).trim()) {
      if (current.length) {
        groups.push(current);
        current = [];
      }
      return;
    }

    current.push(line);
  });

  if (current.length) {
    groups.push(current);
  }

  return groups;
}

function extractCta(lines, explicitCta) {
  if (explicitCta?.href) {
    return { cta: explicitCta, lineIndex: -1 };
  }

  const actionPattern = /^(Confirm email|Reset password|Set password|Login|Open|View|View listing|Review|Manage|Continue|See details|Track request):\s*(https?:\/\/\S+)/i;

  for (let index = 0; index < lines.length; index += 1) {
    const match = String(lines[index]).match(actionPattern);

    if (match) {
      return {
        cta: {
          label: match[1],
          href: match[2]
        },
        lineIndex: index
      };
    }
  }

  return { cta: null, lineIndex: -1 };
}

function renderLogo() {
  if (emailLogoUrl) {
    return `<img src="${escapeAttribute(emailLogoUrl)}" width="132" alt="Travellex" style="display:block;border:0;max-width:132px;height:auto;">`;
  }

  return '<div style="font-size:24px;font-weight:800;letter-spacing:0;color:#12312b;">Travellex</div>';
}

function renderDetailTable(rows, variant) {
  const borderColor = variant === "admin" ? "#d6e3dc" : "#e2e8e1";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${borderColor};border-radius:12px;overflow:hidden;margin:18px 0;">
      <tbody>
        ${rows
          .map(
            ({ label, value }) => `
              <tr>
                <td style="padding:12px 14px;border-bottom:1px solid ${borderColor};font-size:12px;line-height:1.4;color:#5f6f68;text-transform:uppercase;font-weight:700;width:35%;vertical-align:top;">${escapeHtml(label)}</td>
                <td style="padding:12px 14px;border-bottom:1px solid ${borderColor};font-size:14px;line-height:1.5;color:#18342e;vertical-align:top;">${linkify(value || "Not provided")}</td>
              </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

function renderParagraph(line) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#273f38;">${linkify(line)}</p>`;
}

function renderContent(lines, variant) {
  return groupLines(lines)
    .map((group) => {
      const rows = group.map(keyValueLine);
      const detailRows = rows.filter(Boolean);
      const isDetailGroup = detailRows.length === group.length && detailRows.length > 0;

      if (isDetailGroup && (variant === "admin" || detailRows.length > 1)) {
        return renderDetailTable(detailRows, variant);
      }

      return group
        .map((line) => {
          const detail = keyValueLine(line);

          if (detail && variant === "admin") {
            return renderDetailTable([detail], variant);
          }

          return renderParagraph(line);
        })
        .join("");
    })
    .join("");
}

function renderCta(cta) {
  if (!cta?.href) {
    return "";
  }

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:999px;background:#0f766e;">
          <a href="${escapeAttribute(cta.href)}" style="display:inline-block;padding:13px 22px;font-size:14px;line-height:1;color:#ffffff;text-decoration:none;font-weight:800;border-radius:999px;">${escapeHtml(cta.label || "Open Travellex")}</a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:#65746f;">If the button does not work, open this link: ${linkify(cta.href)}</p>`;
}

function buildEmailHtml({ subject, lines, variant = "public", preheader = "", cta }) {
  const palette =
    variant === "admin"
      ? {
          background: "#f3f7f5",
          band: "#dbeee8",
          badgeBg: "#12312b",
          badgeText: "#d9fff3",
          eyebrow: "Admin notification"
        }
      : {
          background: "#f5f7f1",
          band: "#e6f2df",
          badgeBg: "#0f766e",
          badgeText: "#ecfff9",
          eyebrow: "Travellex"
        };
  const normalizedLines = normalizeLines(lines);
  const { cta: resolvedCta, lineIndex } = extractCta(normalizedLines, cta);
  const displayLines = normalizedLines.filter((_, index) => index !== lineIndex);
  const preview = preheader || normalizedLines.find((line) => String(line).trim()) || subject;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:${palette.background};font-family:Arial,Helvetica,sans-serif;color:#18342e;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preview)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${palette.background};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dfe9e4;box-shadow:0 18px 40px rgba(18,49,43,0.08);">
            <tr>
              <td style="background:${palette.band};padding:26px 28px 24px;">
                ${renderLogo()}
                <div style="margin-top:22px;">
                  <span style="display:inline-block;background:${palette.badgeBg};color:${palette.badgeText};border-radius:999px;padding:7px 11px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0;">${palette.eyebrow}</span>
                </div>
                <h1 style="margin:14px 0 0;font-size:26px;line-height:1.2;color:#12312b;font-weight:800;letter-spacing:0;">${escapeHtml(subject)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${renderContent(displayLines, variant)}
                ${renderCta(resolvedCta)}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 26px;background:#fbfcfa;border-top:1px solid #e5eee8;">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#52645d;">Travellex connects travellers with curated tours, guides and partner travel experiences across Africa and beyond.</p>
                <p style="margin:0;font-size:12px;line-height:1.5;color:#7a8883;">
                  <a href="${escapeAttribute(clientUrl)}" style="color:#0f766e;text-decoration:none;">${escapeHtml(clientUrl.replace(/^https?:\/\//, ""))}</a>
                  &nbsp;|&nbsp;
                  <a href="mailto:${escapeAttribute(publicContactEmail)}" style="color:#0f766e;text-decoration:none;">${escapeHtml(publicContactEmail)}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildEmailPayload({ to, subject, lines, variant, preheader, cta, replyTo }) {
  const normalizedLines = normalizeLines(lines);
  const payload = {
    from: resendFromEmail,
    to,
    subject,
    text: normalizedLines.join("\n"),
    html: buildEmailHtml({ subject, lines: normalizedLines, variant, preheader, cta })
  };
  const resolvedReplyTo = replyTo === false ? "" : replyTo || resendReplyTo;

  if (resolvedReplyTo) {
    payload.replyTo = resolvedReplyTo;
  }

  return payload;
}

async function sendEmail({ to, subject, lines, variant = "public", preheader, cta, replyTo }) {
  const resend = getClient();

  if (!resend) {
    if (!missingResendKeyLogged) {
      console.warn("[email] RESEND_API_KEY is not configured. Email delivery is disabled.");
      missingResendKeyLogged = true;
    }

    return { sent: false, reason: "RESEND_API_KEY is not configured." };
  }

  let timeoutId;

  try {
    const response = await Promise.race([
      resend.emails.send(buildEmailPayload({ to, subject, lines, variant, preheader, cta, replyTo })),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Email provider timed out.")), EMAIL_TIMEOUT_MS);
      })
    ]);

    if (response?.error) {
      throw new Error(response.error.message || "Email provider returned an error.");
    }

    return { sent: true, id: response?.data?.id };
  } catch (error) {
    const reason = error.message || "Email could not be sent.";
    console.error("[email] send failed", {
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      reason
    });
    return { sent: false, reason };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function notifyOwner(subject, lines, options = {}) {
  return sendEmail({ to: adminNotificationEmails, subject, lines, variant: "admin", ...options });
}

async function notifyUser(to, subject, lines, options = {}) {
  if (!to) {
    return { sent: false, reason: "Recipient email is missing." };
  }

  return sendEmail({ to, subject, lines, variant: "public", ...options });
}

async function notifyMany(recipients, subject, lines, options = {}) {
  const uniqueRecipients = [...new Set(recipients.filter(Boolean))];
  const statuses = await Promise.all(uniqueRecipients.map((to) => notifyUser(to, subject, lines, options)));
  return { sent: statuses.some((status) => status.sent), recipients: uniqueRecipients, statuses };
}

async function sendEnquiryEmails(enquiry) {
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

  const adminLines = [
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
  ];
  const userLines = [
    `Hello ${enquiry.name},`,
    "",
    `Thank you for contacting Travellex about ${label}.`,
    confirmationText,
    "",
    "Warm regards,",
    "Travellex"
  ];
  const statuses = await Promise.all([
    notifyOwner(`New Travellex enquiry: ${label}`, adminLines, {
      preheader: `${requestType} from ${enquiry.name}`,
      replyTo: enquiry.email || undefined
    }),
    notifyUser(enquiry.email, "We received your Travellex enquiry", userLines, {
      preheader: `Travellex received your request about ${label}.`
    })
  ]);

  return { sent: statuses.some((status) => status.sent), statuses };
}

module.exports = {
  notifyMany,
  notifyOwner,
  notifyUser,
  sendEnquiryEmails
};
