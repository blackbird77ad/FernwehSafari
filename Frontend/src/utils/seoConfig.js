export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://travellex.tours").replace(/\/+$/, "");
export const SITE_NAME = "Travellex";
export const DEFAULT_TITLE = "Travellex | Africa Tours From Germany to Tanzania and Zanzibar";
export const DEFAULT_DESCRIPTION =
  "Compare curated Africa tours from approved operators, with strong coverage for Tanzania safaris, Zanzibar coast trips, Kilimanjaro, Ngorongoro and Germany-to-Africa travel planning.";
export const DEFAULT_KEYWORDS = [
  "Africa tours from Germany",
  "Tanzania safari tours",
  "Zanzibar tours",
  "Kilimanjaro tours",
  "Ngorongoro safari",
  "Germany to Africa travel",
  "Africa travel marketplace",
  "Tanzania travel",
  "Zanzibar holidays",
  "African safari packages"
];
export const DEFAULT_OG_IMAGE = `${SITE_URL}/travellex-og.svg`;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalUrl(path = "/") {
  return absoluteUrl(path).split("#")[0];
}

export function truncateDescription(value = "", fallback = DEFAULT_DESCRIPTION) {
  const text = String(value || fallback).replace(/\s+/g, " ").trim();
  return text.length > 158 ? `${text.slice(0, 155).trim()}...` : text;
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/travellex-pwa-icon.svg`,
    image: DEFAULT_OG_IMAGE,
    email: "experience@travellex.tours",
    telephone: "+49 176 7606 2927",
    areaServed: ["Germany", "Tanzania", "Zanzibar", "Africa"],
    knowsAbout: [
      "Tanzania safari",
      "Zanzibar beach tours",
      "Kilimanjaro trekking",
      "Ngorongoro Crater safari",
      "Germany to Africa travel"
    ],
    sameAs: ["https://www.instagram.com/officialshalom2"]
  };
}

export function buildWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/tours?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
}

export function buildFaqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };
}

export function buildTourItemListSchema(tours = []) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: tours.map((tour, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/tours/${tour.slug}`),
      name: tour.title
    }))
  };
}

export function buildTourSchema(tour) {
  const image = tour.images?.find(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${SITE_URL}/tours/${tour.slug}#tour`,
    name: tour.title,
    description: truncateDescription(tour.description || tour.shortDescription),
    url: absoluteUrl(`/tours/${tour.slug}`),
    image: image ? absoluteUrl(image) : DEFAULT_OG_IMAGE,
    touristType: ["International travellers", "Travellers from Germany", "Africa travel planners"],
    itinerary: tour.location,
    offers: {
      "@type": "Offer",
      price: Number(tour.priceEUR || 0),
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl(`/tours/${tour.slug}`)
    },
    provider: { "@id": `${SITE_URL}/#organization` },
    organizer: tour.partner?.name
      ? {
          "@type": "Organization",
          name: tour.partner.name
        }
      : undefined
  };
}
