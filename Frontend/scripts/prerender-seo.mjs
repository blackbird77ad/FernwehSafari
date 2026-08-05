import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { destinationSeoPages } from "../src/utils/destinationSeoPages.js";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildOrganizationSchema,
  buildWebsiteSchema,
  canonicalUrl,
  truncateDescription
} from "../src/utils/seoConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const distRoot = path.join(frontendRoot, "dist");
const templatePath = path.join(distRoot, "index.html");

const faqItems = [
  ["Do I need a visa for Africa destinations?", "Visa rules vary by country and passport. Always confirm the current rule for your destination before booking flights."],
  ["Is safari travel safe?", "Work with reviewed operators, follow guide instructions and avoid self-planning remote routes without local support."],
  ["Can I combine safari, city and coast in one trip?", "Yes. Many routes combine safari or mountain days with heritage towns, beaches, forests or marine excursions."],
  ["Does Travellex take payment?", "Most tours are completed on the approved operator's booking page. Travellex keeps your tour choice connected for support."],
  ["Who confirms availability?", "The approved tour operator confirms live availability, inclusions, terms and payment details before you pay."],
  ["Can I ask questions before booking?", "Yes. Use the contact form or tour enquiry flow with dates, group size and destination priorities."]
];

const baseRoutes = [
  {
    path: "/",
    title: "Travellex Tours | Africa Tours From Germany to Tanzania and Zanzibar",
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    jsonLd: [buildOrganizationSchema(), buildWebsiteSchema()]
  },
  {
    path: "/tours",
    title: "Travellex Tours Marketplace | Africa Safaris, Tanzania and Zanzibar Trips",
    description:
      "Search approved Africa tours with EUR pricing, including Tanzania safari, Zanzibar beach, Kilimanjaro, Ngorongoro, Stone Town and wider African travel routes.",
    keywords: [
      "Travellex Tours",
      "Africa tours",
      "Tanzania safari tours",
      "Zanzibar tours",
      "Germany to Africa tours",
      "African safari packages",
      "Kilimanjaro tours"
    ],
    jsonLd: [
      buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Tours", path: "/tours" }
      ])
    ]
  },
  {
    path: "/about",
    title: "About Travellex Tours",
    description:
      "Travellex is an Africa-focused marketplace for travellers comparing Tanzania, Zanzibar and wider Africa tours from approved operators.",
    keywords: ["About Travellex", "Travellex Tours", "Africa tour marketplace", "Germany to Africa travel", "Tanzania and Zanzibar travel"],
    jsonLd: buildOrganizationSchema()
  },
  {
    path: "/gallery",
    title: "Africa Travel Gallery",
    description:
      "Browse Africa travel photos and videos from Travellex routes, including Tanzania safari, Zanzibar beaches, Kilimanjaro, Stone Town and wildlife moments.",
    keywords: ["Africa travel gallery", "Tanzania safari photos", "Zanzibar travel photos", "Kilimanjaro travel"],
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: "Travellex Africa travel gallery",
      description: "Safari, Zanzibar, Kilimanjaro, coast, wildlife and culture travel scenes curated by Travellex.",
      url: canonicalUrl("/gallery"),
      image: [DEFAULT_OG_IMAGE]
    }
  },
  {
    path: "/testimonials",
    title: "Africa Tour Traveller Stories",
    description:
      "Traveller stories from Travellex Africa routes, including Tanzania safari, Zanzibar coast, Kilimanjaro and Stone Town planning experiences.",
    keywords: ["Travellex testimonials", "Africa tour reviews", "Tanzania safari reviews", "Zanzibar travel stories"]
  },
  {
    path: "/faq",
    title: "Africa Tour Booking FAQ",
    description:
      "Answers about Travellex Africa tours, Tanzania safari planning, Zanzibar booking, operators, payments, safety and travel preparation.",
    keywords: ["Travellex FAQ", "Africa tour booking questions", "Tanzania safari FAQ", "Zanzibar travel FAQ"],
    jsonLd: buildFaqSchema(faqItems)
  },
  {
    path: "/contact",
    title: "Contact Travellex Tours",
    description:
      "Contact Travellex for Africa travel questions, Tanzania safari planning, Zanzibar tours and Germany-to-Africa trip support.",
    keywords: ["Contact Travellex", "Contact Travellex Tours", "Africa travel questions", "Tanzania safari enquiry", "Zanzibar tour enquiry"],
    jsonLd: buildOrganizationSchema()
  },
  {
    path: "/partner",
    title: "List Africa Tours With Travellex Tours",
    description:
      "Tour companies can apply to list Africa tours on Travellex, reaching travellers searching for Tanzania, Zanzibar, safari, coast, culture and adventure routes.",
    keywords: ["list Africa tours", "tour operator marketplace", "Travellex partner", "Travellex Tours partner", "Tanzania tour company", "Zanzibar tour operator"]
  },
  {
    path: "/virtual-tour",
    title: "Africa Virtual Tour Preview",
    description:
      "Preview Tanzania, Zanzibar, Kilimanjaro, Ngorongoro, Stone Town and island travel scenes before choosing an Africa tour on Travellex.",
    keywords: ["Africa virtual tour", "Zanzibar virtual tour", "Tanzania safari preview", "Kilimanjaro travel preview"]
  }
];

const destinationRoutes = destinationSeoPages.map((page) => {
  const pagePath = `/destinations/${page.slug}`;

  return {
    path: pagePath,
    title: `${page.title} | Travellex Africa Travel`,
    description: page.description,
    keywords: ["Travellex Tours", ...page.keywords],
    type: "article",
    jsonLd: [
      buildOrganizationSchema(),
      buildBreadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Destinations", path: "/tours" },
        { name: page.title, path: pagePath }
      ]),
      buildFaqSchema(page.faqs),
      {
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        "@id": `${SITE_URL}${pagePath}#destination`,
        name: page.title,
        description: page.description,
        url: canonicalUrl(pagePath),
        image: DEFAULT_OG_IMAGE,
        touristType: ["Travellers from Germany", "International travellers", "Africa tour planners"],
        includesAttraction: page.highlights.map((highlight) => ({
          "@type": "TouristAttraction",
          name: highlight
        }))
      }
    ]
  };
});

const routes = [...baseRoutes, ...destinationRoutes];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function brandedTitle(title) {
  return /travellex/i.test(title) ? title : `${title} | ${SITE_NAME}`;
}

function upsertInHead(html, pattern, tag) {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function upsertMeta(html, attribute, key, content) {
  const pattern = new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'])[^>]*>`, "i");
  const tag = `<meta ${attribute}="${key}" content="${escapeAttribute(content)}">`;

  return upsertInHead(html, pattern, tag);
}

function upsertCanonical(html, href) {
  return upsertInHead(
    html,
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i,
    `<link rel="canonical" href="${escapeAttribute(href)}">`
  );
}

function upsertAlternate(html, hreflang, href) {
  const pattern = new RegExp(`<link\\b(?=[^>]*\\brel=["']alternate["'])(?=[^>]*\\bhreflang=["']${escapeRegExp(hreflang)}["'])[^>]*>`, "i");

  return upsertInHead(
    html,
    pattern,
    `<link rel="alternate" href="${escapeAttribute(href)}" hreflang="${escapeAttribute(hreflang)}">`
  );
}

function stripJsonLdContext(node) {
  if (!node || Array.isArray(node) || typeof node !== "object") {
    return node;
  }

  const { "@context": _context, ...rest } = node;

  return rest;
}

function normalizeJsonLd(jsonLd) {
  if (!jsonLd) {
    return [buildOrganizationSchema(), buildWebsiteSchema()];
  }

  if (!Array.isArray(jsonLd)) {
    return jsonLd;
  }

  return {
    "@context": "https://schema.org",
    "@graph": jsonLd.map(stripJsonLdContext)
  };
}

function upsertJsonLd(html, jsonLd) {
  const payload = JSON.stringify(normalizeJsonLd(jsonLd)).replace(/<\/script/gi, "<\\/script");
  const pattern = /<script\b(?=[^>]*\bid=["']travellex-jsonld-static["'])[^>]*>[\s\S]*?<\/script>/i;
  const tag = `<script type="application/ld+json" id="travellex-jsonld-static">${payload}</script>`;

  return upsertInHead(html, pattern, tag);
}

function renderRouteHtml(template, route) {
  const title = brandedTitle(route.title);
  const description = truncateDescription(route.description);
  const keywords = Array.isArray(route.keywords) ? route.keywords.join(", ") : route.keywords;
  const canonical = canonicalUrl(route.path);
  const image = absoluteUrl(route.image || DEFAULT_OG_IMAGE);
  const type = route.type || "website";

  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  html = upsertMeta(html, "name", "description", description);
  html = upsertMeta(html, "name", "keywords", keywords);
  html = upsertMeta(html, "name", "robots", "index, follow, max-image-preview:large");
  html = upsertMeta(html, "name", "application-name", "Travellex Tours");
  html = upsertMeta(html, "name", "author", "Travellex Tours");
  html = upsertMeta(html, "property", "og:site_name", SITE_NAME);
  html = upsertMeta(html, "property", "og:title", title);
  html = upsertMeta(html, "property", "og:description", description);
  html = upsertMeta(html, "property", "og:type", type);
  html = upsertMeta(html, "property", "og:url", canonical);
  html = upsertMeta(html, "property", "og:image", image);
  html = upsertMeta(html, "name", "twitter:title", title);
  html = upsertMeta(html, "name", "twitter:description", description);
  html = upsertMeta(html, "name", "twitter:image", image);
  html = upsertCanonical(html, canonical);
  html = upsertAlternate(html, "en", canonical);
  html = upsertAlternate(html, "x-default", canonical);
  html = upsertJsonLd(html, route.jsonLd);

  return html;
}

function outputPathForRoute(routePath) {
  if (routePath === "/") {
    return templatePath;
  }

  return path.join(distRoot, `${routePath.replace(/^\/+/, "")}.html`);
}

const template = await fs.readFile(templatePath, "utf8");

await Promise.all(
  routes.map(async (route) => {
    const html = renderRouteHtml(template, route);
    const outputPath = outputPathForRoute(route.path);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
  })
);

console.log(`Prerendered SEO HTML for ${routes.length} public routes.`);
