const DEFAULT_API_BASE_URL = "https://fernwehsafari.onrender.com/api";

const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://travellex.tours/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>https://travellex.tours/tours</loc><changefreq>daily</changefreq><priority>0.95</priority></url>
  <url><loc>https://travellex.tours/destinations/germany-to-africa-tours</loc><changefreq>weekly</changefreq><priority>0.92</priority></url>
  <url><loc>https://travellex.tours/destinations/tanzania-tours</loc><changefreq>weekly</changefreq><priority>0.90</priority></url>
  <url><loc>https://travellex.tours/destinations/zanzibar-tours</loc><changefreq>weekly</changefreq><priority>0.90</priority></url>
  <url><loc>https://travellex.tours/destinations/tanzania-safari-tours</loc><changefreq>weekly</changefreq><priority>0.88</priority></url>
  <url><loc>https://travellex.tours/destinations/africa-safari-tours</loc><changefreq>weekly</changefreq><priority>0.88</priority></url>
  <url><loc>https://travellex.tours/gallery</loc><changefreq>weekly</changefreq><priority>0.72</priority></url>
  <url><loc>https://travellex.tours/contact</loc><changefreq>monthly</changefreq><priority>0.62</priority></url>
</urlset>`;

function getApiBaseUrl(env = {}) {
  return String(env.API_PROXY_TARGET || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export async function onRequest({ env }) {
  try {
    const response = await fetch(`${getApiBaseUrl(env)}/seo/sitemap.xml`, {
      headers: { accept: "application/xml" }
    });

    if (response.ok) {
      return new Response(response.body, {
        headers: {
          "Cache-Control": "public, max-age=1800",
          "Content-Type": "application/xml; charset=utf-8"
        },
        status: response.status
      });
    }
  } catch {
    // Static fallback below keeps crawlers from seeing a 500.
  }

  return new Response(fallbackSitemap, {
    headers: {
      "Cache-Control": "public, max-age=600",
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
