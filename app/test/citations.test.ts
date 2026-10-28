import { describe, expect, test } from "vitest";
import { unknownCitations } from "@/lib/citations";

describe("unknownCitations", () => {
  test("allows citations from RULES", () => {
    expect(unknownCitations("Under NY Gen. Oblig. Law §7-108(1-a)(e) and RPL §238-a, and Local Law 119 of 2024.")).toEqual([]);
  });

  test("catches section numbers that aren't in RULES", () => {
    expect(unknownCitations("This violates NYC Admin Code §27-2005.")).toEqual(["§27-2005"]);
  });

  test("catches local laws that aren't in RULES", () => {
    expect(unknownCitations("See Local Law 18 of 2021.")).toEqual(["Local Law 18"]);
  });

  test("plain text has no citations", () => {
    expect(unknownCitations("Your deposit is too high.")).toEqual([]);
  });
});
