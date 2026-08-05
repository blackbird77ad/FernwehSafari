const PRERENDERED_ROUTES = new Set([
  "/tours",
  "/about",
  "/gallery",
  "/testimonials",
  "/faq",
  "/contact",
  "/partner",
  "/virtual-tour",
  "/destinations/germany-to-africa-tours",
  "/destinations/tanzania-tours",
  "/destinations/zanzibar-tours",
  "/destinations/tanzania-safari-tours",
  "/destinations/africa-safari-tours",
  "/destinations/kilimanjaro-tours",
  "/destinations/ngorongoro-crater-safari",
  "/destinations/lake-manyara-safari",
  "/destinations/mikumi-safari",
  "/destinations/stone-town-tours",
  "/destinations/nungwi-kendwa-beach",
  "/destinations/mnemba-island-snorkeling",
  "/destinations/paje-beach-tours",
  "/destinations/jozani-forest-tours"
]);

function acceptsHtml(request) {
  const accept = request.headers.get("accept") || "";

  return accept.includes("text/html") || accept.includes("*/*");
}

function prerenderAssetPath(pathname) {
  return `${pathname.replace(/\/+$/, "")}/`;
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const methodSupportsHtml = request.method === "GET" || request.method === "HEAD";
  const noSlashPath = url.pathname.replace(/\/+$/, "");

  if (url.pathname !== noSlashPath && PRERENDERED_ROUTES.has(noSlashPath)) {
    url.pathname = noSlashPath;
    return Response.redirect(url.toString(), 301);
  }

  if (methodSupportsHtml && acceptsHtml(request) && PRERENDERED_ROUTES.has(url.pathname)) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = prerenderAssetPath(url.pathname);

    return context.env.ASSETS.fetch(new Request(assetUrl.toString(), request));
  }

  return context.next();
}
