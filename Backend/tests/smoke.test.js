const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");
const app = require("../src/app");
const User = require("../src/models/User");
const slugify = require("../src/utils/slugify");

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });
}

test("slugify creates URL-friendly tour slugs", () => {
  assert.equal(slugify("Serengeti 7 Day / 6 Night Safari"), "serengeti-7-day-6-night-safari");
});

test("users default to traveller role and expose CRM roles", async () => {
  const user = new User({
    name: "Test User",
    email: "test@example.com",
    passwordHash: "hashed-password"
  });

  const legacyUser = new User({
    name: "Legacy User",
    email: "legacy@example.com",
    passwordHash: "hashed-password",
    role: "user"
  });

  await legacyUser.validate();

  assert.equal(user.role, "traveller");
  assert.equal(user.emailVerified, true);
  assert.equal(legacyUser.role, "traveller");
  assert.deepEqual(User.USER_ROLES, ["traveller", "tour_company", "tour_guide", "moderator", "admin"]);
});

test("health endpoint responds with the standard success envelope", async () => {
  const server = http.createServer(app);
  const port = await listen(server);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.equal(payload.data.service, "travellex-api");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
