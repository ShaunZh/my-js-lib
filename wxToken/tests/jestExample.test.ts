/* eslint-disable no-undef */
import isArrayLike from "../src/jestExample";

describe("my-lib: isArrayLike", () => {
  test("isArrayLike(): true", () => {
    expect(isArrayLike([])).toBe(true);
  });

  test("isArrayLike(): false", () => {
    expect(isArrayLike({})).toBe(false);
  });
});
