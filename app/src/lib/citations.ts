import { RULES } from "./rules";

const SECTION = /§\s*(\d+(?:-[0-9a-z]+)?)/gi;
const LOCAL_LAW = /Local Law (\d+)/gi;

const citations = Object.values(RULES).map((r) => r.citation).join(" ");
const allowedSections = new Set([...citations.matchAll(SECTION)].map((m) => m[1].toLowerCase()));
const allowedLocalLaws = new Set([...citations.matchAll(LOCAL_LAW)].map((m) => m[1]));

// Any statute or local law named in model-written text that isn't one of our checked rules.
export function unknownCitations(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(SECTION)) {
    if (!allowedSections.has(m[1].toLowerCase())) found.push(`§${m[1]}`);
  }
  for (const m of text.matchAll(LOCAL_LAW)) {
    if (!allowedLocalLaws.has(m[1])) found.push(`Local Law ${m[1]}`);
  }
  return found;
}
