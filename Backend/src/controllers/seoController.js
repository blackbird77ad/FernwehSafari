const asyncHandler = require("../utils/asyncHandler");
const Tour = require("../models/Tour");

const clientUrl = (process.env.CLIENT_URL || "https://travellex.tours").replace(/\/+$/, "");

const staticSitemapPages = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/tours", priority: "0.95", changefreq: "daily" },
  { path: "/destinations/germany-to-africa-tours", priority: "0.92", changefreq: "weekly" },
  { path: "/destinations/tanzania-tours", priority: "0.90", changefreq: "weekly" },
  { path: "/destinations/zanzibar-tours", priority: "0.90", changefreq: "weekly" },
  { path: "/destinations/tanzania-safari-tours", priority: "0.88", changefreq: "weekly" },
  { path: "/destinations/africa-safari-tours", priority: "0.88", changefreq: "weekly" },
  { path: "/destinations/kilimanjaro-tours", priority: "0.84", changefreq: "weekly" },
  { path: "/destinations/ngorongoro-crater-safari", priority: "0.84", changefreq: "weekly" },
  { path: "/destinations/lake-manyara-safari", priority: "0.82", changefreq: "weekly" },
  { path: "/destinations/mikumi-safari", priority: "0.82", changefreq: "weekly" },
  { path: "/destinations/stone-town-tours", priority: "0.82", changefreq: "weekly" },
  { path: "/destinations/nungwi-kendwa-beach", priority: "0.80", changefreq: "weekly" },
  { path: "/destinations/mnemba-island-snorkeling", priority: "0.80", changefreq: "weekly" },
  { path: "/destinations/paje-beach-tours", priority: "0.78", changefreq: "weekly" },
  { path: "/destinations/jozani-forest-tours", priority: "0.78", changefreq: "weekly" },
  { path: "/gallery", priority: "0.72", changefreq: "weekly" },
  { path: "/virtual-tour", priority: "0.70", changefreq: "weekly" },
  { path: "/about", priority: "0.68", changefreq: "monthly" },
  { path: "/testimonials", priority: "0.66", changefreq: "monthly" },
  { path: "/faq", priority: "0.64", changefreq: "monthly" },
  { path: "/contact", priority: "0.62", changefreq: "monthly" },
  { path: "/partner", priority: "0.58", changefreq: "monthly" }
];

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(value = new Date()) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${clientUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function renderUrl({ path, lastmod, changefreq, priority, image }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(absoluteUrl(path))}</loc>`,
    `    <lastmod>${escapeXml(formatDate(lastmod))}</lastmod>`,
    changefreq ? `    <changefreq>${escapeXml(changefreq)}</changefreq>` : "",
    priority ? `    <priority>${escapeXml(priority)}</priority>` : "",
    image
      ? [
          "    <image:image>",
          `      <image:loc>${escapeXml(absoluteUrl(image))}</image:loc>`,
          "    </image:image>"
        ].join("\n")
      : "",
    "  </url>"
  ]
    .filter(Boolean)
    .join("\n");
}

async function buildSitemapXml() {
  const tours = await Tour.find({ isActive: true })
    .select("slug updatedAt createdAt images")
    .sort({ updatedAt: -1 })
    .limit(50000);
  const tourUrls = tours
    .filter((tour) => tour.slug)
    .map((tour) => ({
      path: `/tours/${tour.slug}`,
      lastmod: tour.updatedAt || tour.createdAt,
      changefreq: "weekly",
      priority: "0.76",
      image: tour.images?.find((item) => /^https?:\/\//i.test(item))
    }));
  const urls = [
    ...staticSitemapPages.map((page) => ({
      ...page,
      lastmod: new Date()
    })),
    ...tourUrls
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls.map(renderUrl),
    "</urlset>"
  ].join("\n");
}

const sitemap = asyncHandler(async (req, res) => {
  const xml = await buildSitemapXml();

  res.set("Cache-Control", "public, max-age=1800");
  res.type("application/xml").send(xml);
});

const robots = asyncHandler(async (req, res) => {
  res.type("text/plain").send(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /dashboard",
      "Disallow: /booking",
      "Disallow: /login",
      "Disallow: /register",
      "Disallow: /verify-email",
      "Disallow: /forgot-password",
      "Disallow: /reset-password",
      "Disallow: /api",
      "",
      `Sitemap: ${clientUrl}/sitemap.xml`
    ].join("\n")
  );
});

module.exports = {
  robots,
  sitemap
};
