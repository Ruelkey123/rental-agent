# Rental Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A no-login web app where an NYC renter uploads a lease and gets a lease card with flagged illegal clauses, a "Your Rental" home base (timeline, calendar file, HPD building check), and a "They're charging me" flow that checks deposit rules and drafts a letter.

**Architecture:** A Next.js App Router app. Law-related judgments are **deterministic TypeScript** (deadlines, caps, verdicts) so they can be tested and can't be hallucinated. The model only *extracts* lease facts and *writes* letter prose from facts it's given. Lease data lives in `localStorage`. The PDF is sent to a route handler, passed to the model, and never stored.

**Tech Stack:** Next.js 16.4, React 19, TypeScript, Tailwind, AI SDK 7 (`ai`) via Vercel AI Gateway (model string `anthropic/claude-sonnet-5.5`), zod 4, vitest 4, pdf-lib (sample lease generator only), NYC Open Data SODA API.

**Spec:** `docs/superpowers/specs/2026-10-28-renter-agent-design.md` (and `docs/product-decisions.md`)

## Global Constraints

- App lives at repo root `~/vercel-takehome/app/`. Docs and logs stay at repo root.
- No accounts, no database, nothing purchased. Free tiers only.
- New code only. Nothing copied from `~/dwellify`.
- No fake features: "Something broke" renders as a non-clickable "Coming next" card.
- The model may only cite rules from `RULES` (Task 2). Any flag whose `ruleId` isn't in `RULES` is dropped.
- Every AI output screen shows: "Rental Agent explains NYC renter rules in plain English. It isn't a lawyer and this isn't legal advice."
- No "safety score". Building data is shown as counts and examples only.
- Uploaded PDFs are never written to disk, Blob, or logs.
- Model: `anthropic/claude-sonnet-5.5` through AI Gateway (`model: 'anthropic/claude-sonnet-5.5'` string form).
- **Alex does every Vercel dashboard step by hand** (Task 9). The implementer must not run `vercel deploy`, `vercel link`, or `vercel env add`.
- Time budget: about 3 hours of build. If behind, cut in this order: Task 7 polish → Task 6 → Task 5's calendar file.

## Review Focus

1. **PDF over 4 MB.** Vercel functions reject request bodies over about 4.5 MB. Expect a clear "this file is too big" message *before* upload, not a 413. Test in Task 8.
2. **Not a lease / scanned image PDF.** Expect the lease card to show "Not found in lease" for missing fields, never blanks or invented values. All schema fields are nullable. Test in Task 3.
3. **Address with no HPD records** (outside NYC, typo, new building). Expect "No HPD records found for this address," never "0 violations." Test in Task 6.
4. **Charge dates that don't line up** (no statement received, statement before move-out, move-out in the future). Expect a sensible verdict for each. Test in Task 4.
5. **AI Gateway not configured or erroring.** Expect a visible error with a retry button, not an endless spinner. Route returns `{ error }` with status 502. Test in Task 3.

---

## File Structure

```
app/
  src/lib/rules.ts            NYC rules reference (ids, citation, plain text). Only source of law
  src/lib/lease-schema.ts     zod LeaseSchema + Lease type
  src/lib/flags.ts            deterministic flags + sanitize AI flags
  src/lib/charge.ts           deterministic charge verdict
  src/lib/timeline.ts         lease → timeline events; events → .ics string
  src/lib/hpd.ts              HPD violations fetch + summarize
  src/lib/storage.ts          localStorage wrapper with in-memory fallback
  src/app/api/lease/route.ts  POST pdf → Lease (AI extraction)
  src/app/api/letter/route.ts POST {lease, charge, verdict} → letter text (AI)
  src/app/api/building/route.ts GET ?house&street&zip → BuildingSummary
  src/app/page.tsx            upload / try sample
  src/app/rental/page.tsx     Your Rental home base
  src/app/rental/charge/page.tsx  They're charging me
  src/components/*            LeaseCard, FlagList, Timeline, BuildingCheck, Disclaimer
  scripts/make-sample-lease.ts  generates public/sample-lease.pdf
  test/*.test.ts
```

---

### Task 1: Scaffold the app

**Files:** Create `app/` via create-next-app. Add `app/vitest.config.ts`, `app/test/smoke.test.ts`.

- [ ] **Step 1:** `cd ~/vercel-takehome && npx create-next-app@16.4 app --ts --tailwind --app --src-dir --eslint --use-npm --no-import-alias --turbopack --yes`
- [ ] **Step 2:** `cd app && npm i ai@7 zod@4 && npm i -D vitest@4 pdf-lib tsx`
- [ ] **Step 3:** Add a `"test": "vitest run"` script and a `vitest.config.ts` (node environment, `@` → `src` alias). Write `test/smoke.test.ts` with `expect(1+1).toBe(2)`.
- [ ] **Step 4:** Run `npm test`. Expected: 1 passed. Run `npm run build`. Expected: success.
- [ ] **Step 5:** Commit: `chore: scaffold Next.js app with AI SDK and vitest`.
- [ ] **Step 6 (Alex, friction log):** Note anything from the create-next-app prompts or defaults that surprised you.

### Task 2: NYC rules reference, verified

**Files:** Create `app/src/lib/rules.ts`, `app/test/rules.test.ts`.

**Interfaces:**
- Produces: `type RuleId = 'deposit-cap' | 'move-in-inspection' | 'move-out-inspection' | 'itemized-14-days' | 'forfeit-if-late' | 'punitive-2x' | 'late-fee-cap' | 'broker-fee-fare-act' | 'renewal-notice' | 'habitability'`. `interface Rule { id: RuleId; title: string; plain: string; citation: string; sourceUrl: string }`. `const RULES: Record<RuleId, Rule>`. `function isRuleId(x: string): x is RuleId`.

- [ ] **Step 1: Verify each rule against a primary source** (NY Senate statute pages, NY AG tenant guide, NYC DCWP for the FARE Act). Record `sourceUrl` per rule. Expected values to confirm:
  - deposit-cap: max 1 month's rent. GOL §7-108(1-a)(a)
  - move-in-inspection: landlord must offer inspection and a signed condition agreement before move-in. GOL §7-108(1-a)(c)
  - move-out-inspection: landlord must notify the tenant of the right to a pre-move-out inspection. GOL §7-108(1-a)(d)
  - itemized-14-days: itemized statement plus any balance within 14 days of vacating. GOL §7-108(1-a)(e)
  - forfeit-if-late: missing the 14 days forfeits the right to keep any portion. GOL §7-108(1-a)(g)
  - punitive-2x: willful violation, up to twice the deposit. GOL §7-108(1-a)(h)
  - late-fee-cap: lesser of $50 or 5% of monthly rent, and only after 5 days late. RPL §238-a(2)
  - broker-fee-fare-act: whoever hires the broker pays. Tenant can't be charged the landlord's broker fee. NYC Local Law 119 of 2024, effective 2025-06-11
  - renewal-notice: landlord notice of non-renewal or a ≥5% increase: 30/60/90 days by tenancy length. RPL §226-c
  - habitability: warranty of habitability. RPL §235-b
  If any value differs from the source, **use the source** and note it in `docs/product-decisions.md`.
- [ ] **Step 2: Failing test** `rules.test.ts`: every `RULES` entry has a non-empty `citation` and a `sourceUrl` starting with `https://`. `isRuleId('deposit-cap')` is true, and `isRuleId('made-up')` is false.
- [ ] **Step 3:** Implement `rules.ts`. Run `npm test`. Expected: PASS. Commit `feat: verified NYC renter rules reference`.

### Task 3: Lease schema, flags, and the lease extraction route

**Files:** Create `src/lib/lease-schema.ts`, `src/lib/flags.ts`, `src/app/api/lease/route.ts`, `test/flags.test.ts`, `test/lease-route.test.ts`.

**Interfaces:**
- Consumes: `RULES`, `isRuleId`, `RuleId` (Task 2).
- Produces:
  - `LeaseSchema` (zod). **Every field nullable**: `tenantNames: string[]`, `landlordName`, `landlordContact`, `address: { line1, unit, houseNumber, streetName /* HPD style, uppercase, suffix spelled out e.g. "SEDGWICK AVENUE" */, borough, zip } | null`, `monthlyRent: number|null`, `rentDueDay: number|null`, `leaseStart: string|null /* YYYY-MM-DD */`, `leaseEnd`, `securityDeposit: number|null`, `lateFee: { amount: number|null, graceDays: number|null } | null`, `brokerFeePaidByTenant: boolean|null`, `tenantNoticeDays: number|null`, `repairsResponsibility: string|null`, `utilitiesPaidByTenant: string[]`, `aiFlags: { ruleId: string; quote: string; explanation: string }[]`.
  - `type Lease = z.infer<typeof LeaseSchema>`.
  - `type Flag = { ruleId: RuleId; quote: string | null; explanation: string; source: 'check' | 'ai' }`.
  - `computeFlags(lease: Lease): Flag[]`. Deterministic checks first, then sanitized AI flags, deduped by `ruleId` (deterministic wins).
  - `POST /api/lease` (multipart form field `file`) → `200 Lease` | `400 {error}` | `413 {error}` | `502 {error}`.

- [ ] **Step 1: Failing tests** in `flags.test.ts`:
  - `deposit-cap` flagged when `securityDeposit: 5000, monthlyRent: 2500`, and not flagged at `2500/2500`.
  - `late-fee-cap` flagged for `{amount: 150, graceDays: 1}` at rent 2500 (cap $50), and for `{amount: 50, graceDays: 2}` (grace < 5). Not flagged for `{amount: 50, graceDays: 5}`.
  - `broker-fee-fare-act` flagged when `brokerFeePaidByTenant: true`.
  - an AI flag with `ruleId: 'made-up'` is dropped, and an AI flag with `ruleId: 'deposit-cap'` is deduped against the deterministic one.
  - an all-null lease (scanned/non-lease PDF, Review Focus #2) returns `[]` and doesn't throw.
- [ ] **Step 2:** Run. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `lease-schema.ts` and `flags.ts`. Run. Expected: PASS.
- [ ] **Step 4: Route.** `route.ts` (`runtime = 'nodejs'`, `maxDuration = 60`). Reject a missing file or a non-`application/pdf` file with 400, and files > 4 MB with 413. Call `generateText({ model: 'anthropic/claude-sonnet-5.5', output: Output.object({ schema: LeaseSchema }), messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'file', data: bytes, mediaType: 'application/pdf' }] }] })`. The prompt lists `RULES` (id + plain text) and says: extract only what's written, use null when absent, only use those rule ids in `aiFlags`, and quote the clause verbatim. Wrap the call in try/catch → `502 { error: 'The lease reader is unavailable right now. Try again in a minute.' }` and `console.error` the cause (never the PDF).
- [ ] **Step 5: Route test** `lease-route.test.ts`: mock `ai`'s `generateText` with `vi.mock`. Missing file → 400. 5 MB pdf → 413. `generateText` throws → 502 with an `error` string (Review Focus #5). Happy path → 200 with the mocked lease.
- [ ] **Step 6:** Run `npm test`. Expected: PASS. Commit `feat: lease extraction route and deterministic flags`.

### Task 4: Charge verdict

**Files:** Create `src/lib/charge.ts`, `test/charge.test.ts`.

**Interfaces:**
- Consumes: `Lease`, `RuleId`.
- Produces: `interface ChargeInput { amountCharged: number; reason: string; moveOutDate: string; statementReceived: boolean; statementDate: string | null; today: string }`. `interface ChargeVerdict { deadline: string /* moveOut + 14 days */; deadlinePassed: boolean; statementOnTime: boolean | null; depositOverCap: boolean; findings: { ruleId: RuleId; text: string }[]; ask: 'return-full-deposit' | 'itemized-receipts' | 'wait' }`. `checkCharge(lease: Lease, input: ChargeInput): ChargeVerdict`.

Decision table (dates compared as YYYY-MM-DD strings):

| Situation | ask | findings include |
|---|---|---|
| no statement and today > deadline | `return-full-deposit` | `itemized-14-days`, `forfeit-if-late` |
| statement after deadline | `return-full-deposit` | `itemized-14-days`, `forfeit-if-late` |
| statement on time | `itemized-receipts` | `itemized-14-days` |
| no statement and today ≤ deadline | `wait` | `itemized-14-days` |
| deposit > rent (any of the above) | unchanged | adds `deposit-cap` |

- [ ] **Step 1: Failing tests:** one per table row, plus Review Focus #4: `moveOutDate` in the future → `ask: 'wait'`. `statementDate` earlier than `moveOutDate` → treated as on time. Deadline for move-out `2026-09-30` is `2026-10-14`.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run. Expected: PASS. **Step 5:** Commit `feat: deterministic deposit charge verdict`.

### Task 5: Timeline and calendar file

**Files:** Create `src/lib/timeline.ts`, `test/timeline.test.ts`.

**Interfaces:**
- Consumes: `Lease`.
- Produces: `interface TimelineEvent { id: string; date: string; title: string; agentHelp: string; recurrence?: 'monthly' }`. `buildTimeline(lease: Lease): TimelineEvent[]` (sorted by date). `toIcs(events: TimelineEvent[], leaseEnd: string | null): string`.

Events (skip any whose inputs are null):
- `rent-due`: first due date on/after `leaseStart` on `rentDueDay`, monthly until `leaseEnd`. agentHelp: "Late fees in NY are capped. I'll tell you if they overcharge."
- `tenant-notice`: `leaseEnd − tenantNoticeDays`. "Last day to tell your landlord you're leaving."
- `lease-end`: `leaseEnd`. "Ask for a move-out inspection before you go."
- `deposit-deadline`: `leaseEnd + 14 days`. "Your landlord must send an itemized statement by today, or return your full deposit."

- [ ] **Step 1: Failing tests:** for a lease 2026-01-01 to 2026-12-31, rent day 1, notice 60 → 4 events, `tenant-notice` on `2026-11-01`, `deposit-deadline` on `2027-01-14`. A null `leaseEnd` → only `rent-due` with no UNTIL. `toIcs` output starts with `BEGIN:VCALENDAR`, uses CRLF line endings, has one `VEVENT` per event, all-day `DTSTART;VALUE=DATE:20261101`, and `RRULE:FREQ=MONTHLY;UNTIL=20261231` on rent.
- [ ] **Step 2–4:** Fail → implement (hand-rolled ICS, no dependency, `UID` = `${id}@rental-agent`) → pass.
- [ ] **Step 5:** Commit `feat: lease timeline and calendar export`.

### Task 6: HPD building check

**Files:** Create `src/lib/hpd.ts`, `src/app/api/building/route.ts`, `test/hpd.test.ts`.

**Interfaces:**
- Consumes: `Lease['address']`.
- Produces: `interface BuildingSummary { found: boolean; open: { A: number; B: number; C: number }; totalOpen: number; recent: { class: string; description: string; date: string }[]; sourceUrl: string }`. `fetchBuilding(houseNumber: string, streetName: string, zip: string | null, fetchFn = fetch): Promise<BuildingSummary>`. `GET /api/building?house=&street=&zip=` → `200 BuildingSummary` | `400` | `502`.

Queries against `https://data.cityofnewyork.us/resource/wvxf-dwi5.json` (no key):
- counts: `$select=class,count(*)&$where=housenumber='{h}' AND streetname='{s}' [AND zip='{z}'] AND violationstatus='Open'&$group=class`
- recent: `$select=class,novdescription,inspectiondate&$where=…same…&$order=inspectiondate DESC&$limit=3`
- `found`: run one more `$select=count(*)` without the Open filter. `found = total > 0`.
- Escape single quotes in inputs (`'` → `''`). Uppercase inputs. Route uses `next: { revalidate: 3600 }`.

- [ ] **Step 1: Failing tests** with a fake `fetchFn`: counts rows `[{class:'C',count:'70'},{class:'B',count:'35'}]` → `open.C === 70`, `totalOpen === 105`. Zero total rows → `found: false` (Review Focus #3). The input `O'BRIEN` is sent as `O''BRIEN`. Non-200 → throws.
- [ ] **Step 2–4:** Fail → implement → pass. **Live check:** `curl "localhost:3000/api/building?house=1520&street=SEDGWICK%20AVENUE&zip=10453"` → `found: true` with C > 0.
- [ ] **Step 5:** Commit `feat: HPD building violations check`.

### Task 7: Letter route and sample lease

**Files:** Create `src/app/api/letter/route.ts`, `scripts/make-sample-lease.ts`, `public/sample-lease.pdf`, `test/letter-route.test.ts`.

**Interfaces:**
- Consumes: `Lease`, `ChargeInput`, `ChargeVerdict`, `RULES`.
- Produces: `POST /api/letter` with body `{ lease, charge, verdict }` → `200 { letter: string }` | `400` | `502 { error }`.

- [ ] **Step 1: Letter route.** `generateText` (plain text). The prompt gives only the facts from `lease` and `charge`, the `verdict.findings` with their `RULES[id].plain` and `citation`, and the `ask`. Instructions: a firm, polite letter from tenant to landlord; cite only the rules provided; leave `[bracketed]` placeholders for unknowns; no legal threats beyond the cited rules; under 300 words.
- [ ] **Step 2: Route test** (mock `generateText`): invalid body → 400. Throw → 502. The prompt passed to `generateText` contains `GOL §7-108` when findings include `itemized-14-days`, and contains no citation for rules absent from findings.
- [ ] **Step 3: Sample lease.** `scripts/make-sample-lease.ts` uses pdf-lib to write a 2-page plain residential lease. Values: tenant "Jordan Rivera", landlord "Maple Leaf Realty Holdings LLC" (fictional), "1520 Sedgwick Avenue, Apt 4B, Bronx, NY 10453", rent $2,500 due on the 1st, term 2025-10-01 to 2026-09-30, **deposit $5,000**, **late fee $150 after 1 day**, **"Tenant shall pay the broker fee of 15% of annual rent to Landlord's agent"**, tenant 60 days' notice, landlord handles repairs, tenant pays electric and internet. Run `npx tsx scripts/make-sample-lease.ts` and commit the PDF.
- [ ] **Step 4: Live check:** with `AI_GATEWAY_API_KEY` or a pulled OIDC token in `.env.local` (Task 9 provides it), `curl -F file=@public/sample-lease.pdf localhost:3000/api/lease` returns a lease with deposit 5000, and `computeFlags` on it yields `deposit-cap`, `late-fee-cap`, and `broker-fee-fare-act`.
- [ ] **Step 5:** Commit `feat: letter drafting route and sample lease`.

### Task 8: UI

**Files:** Create `src/lib/storage.ts`, the pages and components from the File Structure, and `test/storage.test.ts`. Use the frontend-design skill for visual direction. Plain, trustworthy, document-like. The lease card and letter are the hero, not a chat.

**Interfaces:**
- Consumes: everything above.
- Produces: `loadLease(): Lease | null`, `saveLease(l: Lease): void`, `clearLease(): void`. Wrap every call in try/catch with an in-memory fallback.

- [ ] **Step 1: Failing test** `storage.test.ts`: when `localStorage.setItem` throws, `saveLease` then `loadLease` returns the lease from memory.
- [ ] **Step 2:** Implement `storage.ts`. Pass. Commit.
- [ ] **Step 3: `/`**: headline with the thesis ("Brokers help you sign. Rental Agent stays."), an upload box, and a "Try with a sample lease" button that fetches `/sample-lease.pdf` and goes through the same upload path. Before posting, the client rejects files over 4 MB with "This file is over 4 MB. Try a smaller scan or export the PDF again." (Review Focus #1). Show a progress state ("Reading your lease…"). On error, show the message and a "Try again" button. On success, `saveLease` → `/rental`.
- [ ] **Step 4: `/rental`**: if there's no lease, redirect to `/`. Sections in order: LeaseCard (null fields render "Not found in lease"), FlagList (`computeFlags`, each with rule title, quote, explanation, citation link), Timeline (`buildTimeline`) with an "Add to my calendar" button (Blob URL download of `toIcs`, filename `rental-agent.ics`), BuildingCheck (calls `/api/building`, shows open A/B/C counts with plain labels, 3 recent items, a link to the source, and "No HPD records found for this address" when `found: false`), then Actions: "They're charging me" → `/rental/charge`, plus a non-clickable "Something broke. Coming next" card. Disclaimer at the bottom. A "Start over" link calls `clearLease`.
- [ ] **Step 5: `/rental/charge`**: a form (amount, reason, move-out date defaulting to `leaseEnd`, statement received yes/no, statement date). On submit, `checkCharge` runs client-side and shows the verdict (deadline date, plain findings with citations). Then POST `/api/letter`, show the letter in a document-style panel with a "Copy letter" button. Errors show a retry.
- [ ] **Step 6: Demo walkthrough** in `npm run dev`: sample lease → three flags → timeline with 4 events → .ics opens in Calendar → building shows Class C count → charge $1,000, move-out 2026-09-30, no statement, today → verdict `return-full-deposit` → letter cites GOL §7-108. Run `npm test && npm run build`. Expected: all pass.
- [ ] **Step 7:** Commit `feat: Rental Agent UI`.

### Task 9: Deploy on Vercel (Alex, by hand; Claude coaches)

Alex does each step in the dashboard and writes a `friction-log.md` entry as it happens, including screenshots into `screenshots/`. Claude only answers questions and fixes code.

- [ ] **Step 1:** Create a GitHub repo and push (`gh repo create` is fine. Claude may run this with Alex's OK).
- [ ] **Step 2:** In the Vercel dashboard: Add New → Project → import the repo. **Set Root Directory to `app`.** Deploy.
- [ ] **Step 3:** Enable AI Gateway for the project. On Vercel, the deployment authenticates via OIDC automatically. Check whether free credits need a card (log it either way).
- [ ] **Step 4:** For local dev: `vercel link` then `vercel env pull app/.env.local` (Alex runs these with `! `), or create an AI Gateway API key → `AI_GATEWAY_API_KEY`.
- [ ] **Step 5:** On the production URL, run the Task 8 Step 6 walkthrough. Check function logs for `/api/lease` in the dashboard.
- [ ] **Step 6:** Update `time-log.md`. Add the live URL to a short root `README.md` (what it is, the demo path, link to the decisions doc).

### Stretch (only if under 3 hrs of build): qualification check

`checkQualification(monthlyRent, annualIncome, guarantorIncome?)` with the 40× / 80× rule, shown as a small card on `/`. Not in v1 unless time remains.
