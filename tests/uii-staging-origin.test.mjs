import test from "node:test";
import assert from "node:assert/strict";
import { assertUiiStagingOrigin } from "../scripts/uii-staging-preflight.mjs";

test("only approved HTTPS frontend origins pass", () => {
  for (const origin of [
    "https://uii-dt-thanh-pilot.vercel.app",
    "https://uii-design-thinking-hub-staging.vercel.app",
    "https://uii-design-thinking-web-staging-gfkd4aq5f-brian-tran-s-projects.vercel.app"
  ]) assert.equal(assertUiiStagingOrigin(origin, "frontend"), origin);
});

test("reject unrelated or unsafe frontend origins", () => {
  for (const origin of [
    "https://usi-design-thinking-web-staging.vercel.app",
    "https://uii-dt-thanh-pilot.vercel.app.evil.example",
    "https://uii-dt-thanh-pilot.vercel.app@evil.example",
    "http://uii-dt-thanh-pilot.vercel.app",
    "https://uii-dt-thanh-pilot.vercel.app/path",
    "https://uii-dt-thanh-pilot.vercel.app?password=bad",
    "https://uii-dt-thanh-pilot.vercel.app/#hash",
  ]) assert.throws(() => assertUiiStagingOrigin(origin, "frontend"), /origin|HTTPS|approved|verified|path|query|fragment|credentials/i);
});

test("readiness checks only accept UII staging API", () => {
  assert.equal(assertUiiStagingOrigin("https://usi-design-thinking-api-staging.onrender.com", "api"),
    "https://usi-design-thinking-api-staging.onrender.com");
  assert.throws(() => assertUiiStagingOrigin("https://my-other-api.onrender.com", "api"), /approved/);
});
