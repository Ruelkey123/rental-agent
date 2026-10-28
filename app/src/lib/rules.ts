// The only source of law the app (and the model) may cite.
// Each rule was checked against its primary source on 2026-10-28.

export type RuleId =
  | "deposit-cap"
  | "move-in-inspection"
  | "move-out-inspection"
  | "itemized-14-days"
  | "forfeit-if-late"
  | "punitive-2x"
  | "late-fee-cap"
  | "broker-fee-fare-act"
  | "renewal-notice"
  | "habitability";

export interface Rule {
  id: RuleId;
  title: string;
  plain: string;
  citation: string;
  sourceUrl: string;
}

const GOL_7_108 = "https://www.nysenate.gov/legislation/laws/GOB/7-108";

export const RULES: Record<RuleId, Rule> = {
  "deposit-cap": {
    id: "deposit-cap",
    title: "Security deposit is capped at one month's rent",
    plain: "A landlord can't collect a security deposit larger than one month's rent.",
    citation: "NY Gen. Oblig. Law §7-108(1-a)",
    sourceUrl: GOL_7_108,
  },
  "move-in-inspection": {
    id: "move-in-inspection",
    title: "Right to a move-in inspection",
    plain:
      "Before you move in, the landlord must offer to inspect the apartment with you and sign a written record of its condition.",
    citation: "NY Gen. Oblig. Law §7-108(1-a)",
    sourceUrl: GOL_7_108,
  },
  "move-out-inspection": {
    id: "move-out-inspection",
    title: "Right to a move-out inspection",
    plain:
      "After you give notice that you're leaving, the landlord must tell you that you can request an inspection before you move out, so you can fix problems first.",
    citation: "NY Gen. Oblig. Law §7-108(1-a)",
    sourceUrl: GOL_7_108,
  },
  "itemized-14-days": {
    id: "itemized-14-days",
    title: "Itemized statement within 14 days of move-out",
    plain:
      "Within 14 days after you move out, the landlord must send an itemized statement of anything kept from your deposit and return the rest.",
    citation: "NY Gen. Oblig. Law §7-108(1-a)(e)",
    sourceUrl: GOL_7_108,
  },
  "forfeit-if-late": {
    id: "forfeit-if-late",
    title: "Missing the 14 days forfeits the deposit",
    plain:
      "If the landlord doesn't send the itemized statement within 14 days, they lose the right to keep any part of the deposit.",
    citation: "NY Gen. Oblig. Law §7-108(1-a)(e)",
    sourceUrl: GOL_7_108,
  },
  "punitive-2x": {
    id: "punitive-2x",
    title: "Willful violations: up to twice the deposit",
    plain:
      "A landlord found to have willfully broken these deposit rules can owe punitive damages of up to twice the deposit.",
    citation: "NY Gen. Oblig. Law §7-108(1-a)(g)",
    sourceUrl: GOL_7_108,
  },
  "late-fee-cap": {
    id: "late-fee-cap",
    title: "Late fees: max $50 or 5%, only after 5 days",
    plain:
      "A late fee can only be charged once rent is more than 5 days late, and can't be more than $50 or 5% of monthly rent, whichever is less.",
    citation: "NY Real Prop. Law §238-a(2)",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/RPP/238-A",
  },
  "broker-fee-fare-act": {
    id: "broker-fee-fare-act",
    title: "You can't be charged the landlord's broker fee",
    plain:
      "Since June 11, 2025, a landlord's agent or listing agent can't charge the tenant a broker fee. Whoever hires the broker pays.",
    citation: "NYC Local Law 119 of 2024 (FARE Act)",
    sourceUrl: "https://www.nyc.gov/site/dca/about/FAQ-Broker-Fees.page",
  },
  "renewal-notice": {
    id: "renewal-notice",
    title: "Notice before non-renewal or a 5%+ increase",
    plain:
      "Before not renewing your lease or raising rent 5% or more, the landlord must give written notice: 30 days if you've lived there under a year, 60 days for 1–2 years, 90 days for over 2 years.",
    citation: "NY Real Prop. Law §226-c",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/RPP/226-C",
  },
  habitability: {
    id: "habitability",
    title: "Warranty of habitability",
    plain:
      "Every residential lease includes a promise that the apartment is fit to live in and free of conditions dangerous to health or safety. You can't waive it.",
    citation: "NY Real Prop. Law §235-b",
    sourceUrl: "https://www.nysenate.gov/legislation/laws/RPP/235-B",
  },
};

export function isRuleId(x: string): x is RuleId {
  return Object.hasOwn(RULES, x);
}
