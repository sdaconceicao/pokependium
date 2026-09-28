import { formatHeight, formatWeight, getDexNumber } from "./PokemonHero.utils";

describe("PokemonHero Utilities", () => {
  describe("getDexNumber", () => {
    it("should pad single digit ids to three digits", () => {
      expect(getDexNumber(1)).toBe("#001");
      expect(getDexNumber(4)).toBe("#004");
    });

    it("should pad double digit ids to three digits", () => {
      expect(getDexNumber(25)).toBe("#025");
    });

    it("should leave three digit ids unpadded", () => {
      expect(getDexNumber(151)).toBe("#151");
    });

    it("should not truncate ids longer than three digits", () => {
      expect(getDexNumber(1025)).toBe("#1025");
    });

    it("should accept string ids, matching the GraphQL ID scalar", () => {
      expect(getDexNumber("7")).toBe("#007");
      expect(getDexNumber("143")).toBe("#143");
    });
  });

  describe("formatHeight", () => {
    it("formats feet as Pokemon-style feet and inches", () => {
      expect(formatHeight(2.29659)).toBe("2'04\"");
    });

    it("zero-pads single-digit inches", () => {
      expect(formatHeight(3.91667)).toBe("3'11\"");
    });

    it("handles exact foot boundaries", () => {
      expect(formatHeight(5)).toBe("5'00\"");
    });
  });

  describe("formatWeight", () => {
    it("formats pounds with one decimal and unit label", () => {
      expect(formatWeight(15.211878)).toBe("15.2 lbs");
    });

    it("shows one decimal for whole-number weights", () => {
      expect(formatWeight(10)).toBe("10.0 lbs");
    });
  });
});
