const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /booking
Disallow: /login
Disallow: /register
Disallow: /verify-email
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /api

Sitemap: https://travellex.tours/sitemap.xml
`;

export function onRequest() {
  return new Response(robots, {
    headers: {
      "Cache-Control": "public, max-age=1800",
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
