import { describe, expect, test } from "vitest";
import { RULES, isRuleId } from "@/lib/rules";

describe("RULES", () => {
  test("every rule has a citation and an https source", () => {
    for (const rule of Object.values(RULES)) {
      expect(rule.citation.length).toBeGreaterThan(0);
      expect(rule.sourceUrl.startsWith("https://")).toBe(true);
    }
  });

  test("isRuleId accepts known ids and rejects unknown ones", () => {
    expect(isRuleId("deposit-cap")).toBe(true);
    expect(isRuleId("made-up")).toBe(false);
  });
});
