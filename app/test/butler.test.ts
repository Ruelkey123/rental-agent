import { describe, expect, test } from "vitest";
import { amenityEvent, checkDraft, extractEmail, mailtoLink, systemPrompt } from "@/lib/butler";
import { lease } from "./fixtures";

describe("extractEmail", () => {
  test("finds an email inside a contact string", () => {
    expect(extractEmail("400 Grand Concourse, (718) 555-0142, leasing@mapleleafmgmt.example")).toBe("leasing@mapleleafmgmt.example");
  });
  test("returns null when there is no email", () => {
    expect(extractEmail("(718) 555-0142")).toBeNull();
    expect(extractEmail(null)).toBeNull();
  });
});

describe("mailtoLink", () => {
  test("encodes subject and body, keeping line breaks", () => {
    expect(mailtoLink("a@b.example", "Sink & faucet", "Hi,\nThanks!")).toBe(
      "mailto:a@b.example?subject=Sink%20%26%20faucet&body=Hi%2C%0AThanks!",
    );
  });
  test("works with no recipient", () => {
    expect(mailtoLink(null, "Hi", "There")).toBe("mailto:?subject=Hi&body=There");
  });
});

describe("checkDraft", () => {
  test("rejects drafts that cite statutes outside the rules list", () => {
    expect(checkDraft("Per NYC Admin Code §27-2005, fix it.")).toEqual({ ok: false, stray: ["§27-2005"] });
  });
  test("accepts friendly drafts", () => {
    expect(checkDraft("Hi! The kitchen faucet is dripping. Could someone take a look this week?")).toEqual({ ok: true, stray: [] });
  });
});

describe("amenityEvent", () => {
  test("turns a request into a calendar event", () => {
    expect(amenityEvent({ amenity: "Rooftop grill", date: "2026-11-07", time: "6 pm" })).toMatchObject({
      date: "2026-11-07",
      title: "Rooftop grill (requested), 6 pm",
    });
  });
});

describe("systemPrompt", () => {
  const prompt = systemPrompt(
    lease({ landlordName: "Maple Leaf Realty Holdings LLC", address: { line1: "1520 Sedgwick Avenue", unit: "4B", houseNumber: "1520", streetName: "SEDGWICK AVENUE", borough: "Bronx", zip: "10453" } }),
    "2026-10-29",
  );
  test("includes the renter's lease facts and today's date", () => {
    expect(prompt).toContain("Maple Leaf Realty Holdings LLC");
    expect(prompt).toContain("1520 Sedgwick Avenue");
    expect(prompt).toContain("Thursday, 2026-10-29");
  });
  test("lists only rules from RULES as citable", () => {
    expect(prompt).toContain("RPL §235-b".replace("RPL", "NY Real Prop. Law"));
    expect(prompt).not.toContain("27-2005");
  });
});
