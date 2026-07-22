import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
  canonicalUrl,
  truncateDescription
} from "../utils/seoConfig";

function upsertMeta(attribute, key, content) {
  if (!content && content !== "") {
    return;
  }

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function upsertLink(rel, href, extra = {}) {
  let element = document.head.querySelector(`link[rel="${rel}"]${extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ""}`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    Object.entries(extra).forEach(([key, value]) => element.setAttribute(key, value));
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function normalizeJsonLd(jsonLd) {
  if (!jsonLd) {
    return null;
  }

  return Array.isArray(jsonLd) ? { "@context": "https://schema.org", "@graph": jsonLd } : jsonLd;
}

export default function SEO({
  canonicalPath,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_OG_IMAGE,
  jsonLd,
  keywords = DEFAULT_KEYWORDS,
  noindex = false,
  title = DEFAULT_TITLE,
  type = "website"
}) {
  const location = useLocation();

  useEffect(() => {
    const nextTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const nextDescription = truncateDescription(description);
    const canonical = canonicalUrl(canonicalPath || location.pathname || "/");
    const nextImage = absoluteUrl(image);
    const structuredData = normalizeJsonLd(jsonLd);
    let script = document.getElementById("travellex-jsonld");

    document.documentElement.lang = "en";
    document.title = nextTitle;

    upsertMeta("name", "description", nextDescription);
    upsertMeta("name", "keywords", Array.isArray(keywords) ? keywords.join(", ") : keywords);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", nextTitle);
    upsertMeta("property", "og:description", nextDescription);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", nextImage);
    upsertMeta("property", "og:locale", "en_US");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", nextTitle);
    upsertMeta("name", "twitter:description", nextDescription);
    upsertMeta("name", "twitter:image", nextImage);
    upsertLink("canonical", canonical);
    upsertLink("alternate", canonical, { hreflang: "en" });
    upsertLink("alternate", canonical, { hreflang: "x-default" });

    if (structuredData) {
      document.getElementById("travellex-jsonld-static")?.remove();

      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "travellex-jsonld";
        document.head.appendChild(script);
      }

      script.textContent = JSON.stringify(structuredData);
    } else if (script) {
      script.remove();
    }
  }, [canonicalPath, description, image, jsonLd, keywords, location.pathname, noindex, title, type]);

  return null;
}
