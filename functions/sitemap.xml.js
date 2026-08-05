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
  <url><loc>https://travellex.tours/destinations/kilimanjaro-tours</loc><changefreq>weekly</changefreq><priority>0.84</priority></url>
  <url><loc>https://travellex.tours/destinations/ngorongoro-crater-safari</loc><changefreq>weekly</changefreq><priority>0.84</priority></url>
  <url><loc>https://travellex.tours/destinations/lake-manyara-safari</loc><changefreq>weekly</changefreq><priority>0.82</priority></url>
  <url><loc>https://travellex.tours/destinations/mikumi-safari</loc><changefreq>weekly</changefreq><priority>0.82</priority></url>
  <url><loc>https://travellex.tours/destinations/stone-town-tours</loc><changefreq>weekly</changefreq><priority>0.82</priority></url>
  <url><loc>https://travellex.tours/destinations/nungwi-kendwa-beach</loc><changefreq>weekly</changefreq><priority>0.80</priority></url>
  <url><loc>https://travellex.tours/destinations/mnemba-island-snorkeling</loc><changefreq>weekly</changefreq><priority>0.80</priority></url>
  <url><loc>https://travellex.tours/destinations/paje-beach-tours</loc><changefreq>weekly</changefreq><priority>0.78</priority></url>
  <url><loc>https://travellex.tours/destinations/jozani-forest-tours</loc><changefreq>weekly</changefreq><priority>0.78</priority></url>
  <url><loc>https://travellex.tours/gallery</loc><changefreq>weekly</changefreq><priority>0.72</priority></url>
  <url><loc>https://travellex.tours/virtual-tour</loc><changefreq>weekly</changefreq><priority>0.70</priority></url>
  <url><loc>https://travellex.tours/about</loc><changefreq>monthly</changefreq><priority>0.68</priority></url>
  <url><loc>https://travellex.tours/testimonials</loc><changefreq>monthly</changefreq><priority>0.66</priority></url>
  <url><loc>https://travellex.tours/faq</loc><changefreq>monthly</changefreq><priority>0.64</priority></url>
  <url><loc>https://travellex.tours/contact</loc><changefreq>monthly</changefreq><priority>0.62</priority></url>
  <url><loc>https://travellex.tours/partner</loc><changefreq>monthly</changefreq><priority>0.58</priority></url>
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
