import { describe, expect, it } from "vitest";

import { decimetersToFeet, hectogramsToPounds } from "./conversion";

describe("decimetersToFeet", () => {
  it("converts Bulbasaur height (7 dm) to feet", () => {
    expect(decimetersToFeet(7)).toBeCloseTo(2.29659, 4);
  });
});

describe("hectogramsToPounds", () => {
  it("converts Bulbasaur weight (69 hg) to pounds", () => {
    expect(hectogramsToPounds(69)).toBeCloseTo(15.211878, 4);
  });
});
