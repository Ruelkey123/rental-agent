import { afterEach, describe, expect, test, vi } from "vitest";
import { clearLease, loadLease, saveLease } from "@/lib/storage";
import { lease } from "./fixtures";

afterEach(() => {
  vi.unstubAllGlobals();
  clearLease();
});

describe("storage", () => {
  test("falls back to memory when localStorage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });
    const l = lease({ monthlyRent: 2500 });
    saveLease(l);
    expect(loadLease()).toEqual(l);
  });

  test("returns null when nothing is saved", () => {
    expect(loadLease()).toBeNull();
  });
});
