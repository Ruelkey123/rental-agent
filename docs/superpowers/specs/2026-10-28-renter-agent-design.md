# Renter Agent: v1 Design

*Working name. Vercel PM take-home, 2026-10-28. Total budget 4–6 hrs including friction log; about 3 hrs of building.*

## Intent: the why

Brokers get paid to help you find an apartment and sign. Then they disappear. Nobody is on the renter's side for the year or more they actually live there: when something breaks, when the landlord goes quiet, or when a surprise charge shows up at move-out.

Alex lived this. A landlord (Seattle) claimed Alex owed about $1,000 for repairs. Alex got a lawyer, sent photos of the apartment's condition, and **demanded the paper trail: what work was done and what it actually cost.** The landlord backed down, and in the end owed Alex money. What won was documented proof, not argument.

**The thesis:** brokers are paid for the transaction, but renters need help for the whole relationship. This agent stays with you after you sign.

## Full vision (for the demo opener, NOT v1). Reasoning for each deferral in `docs/product-decisions.md`

1. Hunts listings continuously (the good ones are gone in 24–48 hrs). *Next*
2. Writes the brokers, books showings, reschedules when they flake. *Next*
3. Checks whether you qualify before you apply, guarantor included. *Next, cheap stretch*
4. **Reads the lease against New York law before you sign, then helps through the tenancy and gets your deposit back at the end. ← v1**

Demo framing: show this list first, then "I built #4, here's why." Starting at the end of the journey is deliberate: nobody serves it, it's where Alex was hurt, and the lease is the data that makes every other step smarter.

## User

A renter in **New York City** with a signed or about-to-sign lease. Not landlords, brokers, or property managers.

## v1: what it does

**Name:** Rental Agent.

**The single demo story:** *"Upload your lease → here's your rental year and what I'm watching for you → fast-forward to move-out → 'they're charging me $1,000' → the agent knows the deadline passed and writes the letter."* About 90 seconds.

**Core idea:** the agent works for you *while you rent*, not just at signing. After upload you land on a home base ("Your Rental"), not a one-off report.

1. **Read my lease.** Upload a lease PDF (or use the sample). The agent produces a **lease card**: rent, due date, lease start/end, renewal/notice deadline, security deposit, landlord name/contact/address, who handles repairs and utilities. Clauses that are risky or likely illegal under NY/NYC law get flagged in plain English (for example, a deposit over one month's rent, or a broker fee charged to the tenant), each with the rule it breaks.
2. **"They're charging me."** Enter the charge: amount, what they say it's for, move-out date, and whether/when you received an itemized statement. The agent checks it against the deposit rules (14-day itemization deadline, deposit cap, inspection offer) and gives a plain verdict on what the landlord did or didn't do right, plus a firm, ready-to-send letter demanding itemized costs and receipts (or return of the deposit if the deadline was missed). The letter cites the lease and the specific rule.
3. **Building check.** Uses the address from the lease to pull the building's HPD violations from NYC Open Data (dataset `wvxf-dwi5`, no key needed): open violations by class A/B/C, plus a few recent examples. Re-fetched each time "Your Rental" loads. Show the data plainly, with no invented "safety score." Handle "address not found" honestly.
4. **"Your Rental" home base, the "works for you while you rent" layer.**
   - **Rental timeline** derived from the lease card: rent due dates, renewal notice window, lease end, and the 14-day post-move-out itemization deadline. Each date says what the agent will help with when it arrives.
   - **"Add to my calendar":** downloads a standard calendar file (.ics) of those dates. That's real reminders with no accounts.
   - **Action buttons:** "They're charging me" (live). "Something broke" is shown as clearly labeled *coming next*, not as a fake button.
5. **Sample lease.** A realistic sample NYC lease PDF with planted problems (for example, a 2-month deposit, a broker fee charged to the tenant, entry without notice) and a real NYC address with some HPD violations. Reached from a "Try with a sample lease" button.

Priority if time runs short: 1 → 5 → 2 → 4 → 3. Items 1 and 2 must work end to end.

**Cut from v1 (2026-10-28):** evidence file, rights chat, "something broke." They are recorded in product-decisions.md (Decision 7).

## NYC rules the agent relies on

A small, hand-curated reference baked into the prompt, **not** a live legal database. Each rule must be verified against a primary source before shipping and cited in the UI. To check:

- Security deposit capped at one month's rent (NY GOL §7-108, 2019 HSTPA).
- Landlord must offer a move-in inspection and written condition agreement, and offer a pre-move-out inspection.
- Itemized statement of deductions within **14 days** of move-out. If they miss it, they forfeit the right to keep any of the deposit.
- Willful violation: punitive damages up to **2× the deposit**.
- FARE Act (NYC, 2025): the party that hires the broker pays the broker fee.
- Warranty of habitability (RPL §235-b). NYC heat season rules. Landlord entry notice norms.

Every output carries a short "this is not legal advice" line.

## Non-goals (the "what I chose not to build" story)

- Listing search, booking showings, qualification check (vision 1–3).
- Landlord portfolio, rent-stabilization status, legal-rent check (see Decision 6 in product-decisions.md).
- Accounts and logins. Multiple apartments. Landlord or broker features.
- Actually sending emails or letters. It drafts, and the renter sends.
- Reminders, calendar, notifications.
- States and cities other than NYC.
- Payments or monetization.

## Anti-goals: a failure even if it works

- **Confidently wrong law.** A letter citing a rule that doesn't exist is worse than no letter. Prefer "I'm not sure, check X" over inventing.
- **Leaking a lease.** Leases contain names, addresses, and signatures. No public URLs to uploaded leases or photos. No retention beyond what's needed.
- **Fake features.** No buttons that pretend to do something. The panel includes an engineer.
- **Generic chatbot feel.** The lease card and the letter are the product. Chat is secondary.

## Constraints

- About 3 hours of build. The hard stop is 6 hours total including the friction log.
- Deployed on Vercel, working at a public URL with **no sign-up**.
- Nothing purchased. Free tiers only.
- New code. Nothing reused from Dwellify.
- **Alex does the Vercel steps by hand** (import project, env vars, AI Gateway setup, Blob, deploy logs) and writes friction-log entries as they happen. Claude writes the code.
- Must demo reliably in 60 seconds: ship a **sample NYC lease PDF** with planted issues (for example, a 2-month deposit and a broker-fee clause) and a "try with sample lease" button, so the panel never needs a real lease.

## How it gets made (Claude's calls; Alex can override)

- Next.js (App Router) on Vercel.
- Vercel AI SDK through **Vercel AI Gateway** for model calls (free monthly credit), with structured output for the lease card and charge check. Default to a current Claude model.
- Lease PDF is sent to the model directly as a file. Storage only if needed.
- Evidence photos: **Vercel Blob** if it can be kept private; otherwise kept in the browser only. Builder decides after checking Blob's privacy options, and logs the finding in the friction log.
- State lives in the browser (no database). Accepted tradeoff: clearing your browser clears your file.

## Left to the builder

UI layout and styling, component library, exact prompt wording, how the lease card is laid out, file-size limits, error states, and the sample lease's exact content.

## What "next" looks like (for the interview)

Accounts plus a database (so your file survives), reminders driven by lease dates (cron), sending letters on your behalf, the qualification check (vision #3), and then search and showings (vision #1–2) once a listing-data source exists.
