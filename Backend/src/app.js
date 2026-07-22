const express = require("express");
const cors = require("cors");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const enquiryRoutes = require("./routes/enquiryRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const guideRoutes = require("./routes/guideRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const referralRoutes = require("./routes/referralRoutes");
const seoRoutes = require("./routes/seoRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const tourRoutes = require("./routes/tourRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const userRoutes = require("./routes/userRoutes");
const { robots, sitemap } = require("./controllers/seoController");
const errorHandler = require("./middleware/errorHandler");

const app = express();

function normalizeOrigin(origin = "") {
  return String(origin).trim().replace(/\/+$/, "");
}

const configuredOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_ORIGINS || "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
];
const allowedOrigins = [
  ...configuredOrigins.map((origin) => normalizeOrigin(origin)),
  "https://travellex.tours",
  "https://www.travellex.tours",
  "https://fernwehsafari.pages.dev",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (uniqueAllowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  try {
    const { hostname, port, protocol } = new URL(normalizedOrigin);
    const isHttps = protocol === "https:";
    const isLocalDevOrigin =
      protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(hostname) &&
      ["5173", "5174", "5175", "5176"].includes(port);

    if (isLocalDevOrigin) {
      return true;
    }

    return (
      isHttps &&
      (hostname === "travellex.tours" ||
        hostname === "www.travellex.tours" ||
        hostname === "fernwehsafari.pages.dev" ||
        hostname.endsWith(".fernwehsafari.pages.dev"))
    );
  } catch (error) {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      service: "travellex-api",
      status: "ok",
      time: new Date().toISOString()
    }
  });
});

app.get("/robots.txt", robots);
app.get("/sitemap.xml", sitemap);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

app.use(errorHandler);

module.exports = app;
