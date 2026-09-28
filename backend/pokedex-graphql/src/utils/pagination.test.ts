import { describe, expect, it } from "vitest";

import { getPaginatedResults } from "./pagination";

describe("getPaginatedResults", () => {
  const mockResults = [
    { id: 1, name: "bulbasaur" },
    { id: 2, name: "ivysaur" },
    { id: 3, name: "venusaur" },
    { id: 4, name: "charmander" },
    { id: 5, name: "charmeleon" },
    { id: 6, name: "charizard" },
    { id: 7, name: "squirtle" },
    { id: 8, name: "wartortle" },
    { id: 9, name: "blastoise" },
    { id: 10, name: "caterpie" },
  ];

  it("should return paginated results with limit and offset", () => {
    const result = getPaginatedResults(mockResults, 3, 2);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { id: 3, name: "venusaur" },
      { id: 4, name: "charmander" },
      { id: 5, name: "charmeleon" },
    ]);
  });

  it("should return results from offset when no limit is provided", () => {
    const result = getPaginatedResults(mockResults, 0, 5);

    expect(result).toHaveLength(5);
    expect(result).toEqual([
      { id: 6, name: "charizard" },
      { id: 7, name: "squirtle" },
      { id: 8, name: "wartortle" },
      { id: 9, name: "blastoise" },
      { id: 10, name: "caterpie" },
    ]);
  });

  it("should return empty array when offset is beyond array length", () => {
    const result = getPaginatedResults(mockResults, 5, 15);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should return partial results when offset + limit exceeds array length", () => {
    const result = getPaginatedResults(mockResults, 5, 7);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { id: 8, name: "wartortle" },
      { id: 9, name: "blastoise" },
      { id: 10, name: "caterpie" },
    ]);
  });

  it("should return all results when limit is larger than array length", () => {
    const result = getPaginatedResults(mockResults, 20, 0);

    expect(result).toHaveLength(10);
    expect(result).toEqual(mockResults);
  });

  it("should return empty array when offset equals array length", () => {
    const result = getPaginatedResults(mockResults, 5, 10);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle zero offset correctly", () => {
    const result = getPaginatedResults(mockResults, 4, 0);

    expect(result).toHaveLength(4);
    expect(result).toEqual([
      { id: 1, name: "bulbasaur" },
      { id: 2, name: "ivysaur" },
      { id: 3, name: "venusaur" },
      { id: 4, name: "charmander" },
    ]);
  });

  it("should handle zero limit correctly", () => {
    const result = getPaginatedResults(mockResults, 0, 3);

    expect(result).toHaveLength(7);
    expect(result).toEqual([
      { id: 4, name: "charmander" },
      { id: 5, name: "charmeleon" },
      { id: 6, name: "charizard" },
      { id: 7, name: "squirtle" },
      { id: 8, name: "wartortle" },
      { id: 9, name: "blastoise" },
      { id: 10, name: "caterpie" },
    ]);
  });

  it("should handle both zero limit and zero offset", () => {
    const result = getPaginatedResults(mockResults, 0, 0);

    expect(result).toHaveLength(10);
    expect(result).toEqual(mockResults);
  });

  it("should handle empty array input", () => {
    const emptyArray: any[] = [];
    const result = getPaginatedResults(emptyArray, 5, 0);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle single item array", () => {
    const singleItemArray = [{ id: 1, name: "bulbasaur" }];
    const result = getPaginatedResults(singleItemArray, 3, 0);

    expect(result).toHaveLength(1);
    expect(result).toEqual(singleItemArray);
  });

  it("should handle negative offset by treating it as 0", () => {
    const result = getPaginatedResults(mockResults, 3, -2);

    expect(result).toHaveLength(3);
    expect(result).toEqual([
      { id: 1, name: "bulbasaur" },
      { id: 2, name: "ivysaur" },
      { id: 3, name: "venusaur" },
    ]);
  });

  it("should handle negative limit by treating it as 0 (no limit)", () => {
    const result = getPaginatedResults(mockResults, -3, 2);

    expect(result).toHaveLength(8);
    expect(result).toEqual([
      { id: 3, name: "venusaur" },
      { id: 4, name: "charmander" },
      { id: 5, name: "charmeleon" },
      { id: 6, name: "charizard" },
      { id: 7, name: "squirtle" },
      { id: 8, name: "wartortle" },
      { id: 9, name: "blastoise" },
      { id: 10, name: "caterpie" },
    ]);
  });

  it("should preserve original array order", () => {
    const result = getPaginatedResults(mockResults, 4, 3);

    expect(result).toHaveLength(4);
    expect(result).toEqual([
      { id: 4, name: "charmander" },
      { id: 5, name: "charmeleon" },
      { id: 6, name: "charizard" },
      { id: 7, name: "squirtle" },
    ]);
  });

  it("should work with different data types", () => {
    const mixedArray = ["string", 42, { key: "value" }, [1, 2, 3], null, undefined];
    const result = getPaginatedResults(mixedArray, 3, 1);

    expect(result).toHaveLength(3);
    expect(result).toEqual([42, { key: "value" }, [1, 2, 3]]);
  });

  it("should handle non-array input gracefully", () => {
    const result = getPaginatedResults(null as any, 5, 0);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle undefined input gracefully", () => {
    const result = getPaginatedResults(undefined as any, 5, 0);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle very large offset values", () => {
    const result = getPaginatedResults(mockResults, 5, 1000);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it("should handle very large limit values", () => {
    const result = getPaginatedResults(mockResults, 1000000, 0);

    expect(result).toHaveLength(10);
    expect(result).toEqual(mockResults);
  });

  it("should handle decimal offset and limit values", () => {
    const result = getPaginatedResults(mockResults, 3.7, 2.3);

    expect(result).toHaveLength(4);
    expect(result).toEqual([
      { id: 3, name: "venusaur" },
      { id: 4, name: "charmander" },
      { id: 5, name: "charmeleon" },
      { id: 6, name: "charizard" },
    ]);
  });
});
