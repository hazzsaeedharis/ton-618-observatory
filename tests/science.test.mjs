import test from "node:test";
import assert from "node:assert/strict";
import {
  schwarzschildRadiusAU,
  scaleMetrics,
  AU_METERS,
} from "../src/science.mjs";

test("one solar mass gives the established ~2.953 km Schwarzschild radius", () => {
  assert.ok(
    Math.abs((schwarzschildRadiusAU(1) * AU_METERS) / 1000 - 2.95334) < 0.001,
  );
});
test("TON 618 comparison uses event-horizon diameter, not lensed shadow diameter", () => {
  const m = scaleMetrics();
  assert.ok(m.radiusAU > 1300 && m.radiusAU < 1305);
  assert.ok(m.diameterAU > 2600 && m.diameterAU < 2610);
  assert.ok(m.neptuneRatio > 43 && m.neptuneRatio < 44);
  assert.ok(m.lightCrossingDays > 15 && m.lightCrossingDays < 15.1);
});
test("mass uncertainty propagates linearly through the scale comparison", () => {
  const a = scaleMetrics(40e9),
    b = scaleMetrics(66e9);
  assert.ok(Math.abs(a.neptuneRatio / b.neptuneRatio - 40 / 66) < 1e-12);
});
test("invalid physical masses are rejected", () => {
  for (const mass of [0, -1, NaN, Infinity])
    assert.throws(() => schwarzschildRadiusAU(mass), RangeError);
});
