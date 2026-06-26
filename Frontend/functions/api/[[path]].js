const DEFAULT_API_BASE_URL = "https://fernwehsafari.onrender.com/api";
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
]);

function getApiBaseUrl(env = {}) {
  return String(env.API_PROXY_TARGET || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function buildTargetUrl(request, env) {
  const incomingUrl = new URL(request.url);
  const pathAfterApi = incomingUrl.pathname.replace(/^\/api\/?/, "");
  const targetUrl = new URL(`${getApiBaseUrl(env)}/${pathAfterApi}`);

  targetUrl.search = incomingUrl.search;
  return targetUrl;
}

function copyRequestHeaders(headers) {
  const nextHeaders = new Headers(headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    nextHeaders.delete(header);
  }

  nextHeaders.delete("host");
  return nextHeaders;
}

function copyResponseHeaders(headers) {
  const nextHeaders = new Headers(headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    nextHeaders.delete(header);
  }

  return nextHeaders;
}

export async function onRequest(context) {
  const { env, request } = context;
  const targetUrl = buildTargetUrl(request, env);
  const hasBody = !["GET", "HEAD"].includes(request.method);

  try {
    const upstreamResponse = await fetch(targetUrl, {
      body: hasBody ? request.body : undefined,
      headers: copyRequestHeaders(request.headers),
      method: request.method,
      redirect: "manual"
    });

    return new Response(upstreamResponse.body, {
      headers: copyResponseHeaders(upstreamResponse.headers),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Travellex API is temporarily unavailable."
      },
      {
        status: 502
      }
    );
  }
}
