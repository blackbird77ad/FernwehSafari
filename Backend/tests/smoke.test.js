const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const app = require("../src/app");
const slugify = require("../src/utils/slugify");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

test("slugify creates URL-friendly tour slugs", () => {
  assert.equal(slugify("Serengeti 7 Day / 6 Night Safari"), "serengeti-7-day-6-night-safari");
});

test("health endpoint responds with the standard success envelope", async () => {
  const server = http.createServer(app);
  const port = await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.service, "fernweh-safari-api");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
