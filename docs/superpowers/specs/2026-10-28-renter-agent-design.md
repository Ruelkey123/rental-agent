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

The single demo story: *"My landlord is trying to keep $1,000 of my deposit. The agent helped me make them prove it."*

1. **Read my lease (full).** Upload a lease PDF. The agent produces a **lease card**: rent, due date, lease start/end, renewal/notice deadline, security deposit, landlord name/contact, who handles repairs and utilities. Clauses that are risky or likely illegal under NY/NYC law get flagged in plain English (for example, a deposit over one month's rent, or a broker fee charged to the tenant).
2. **Ask about my lease and rights (small).** A chat that answers questions like "Can they enter without notice?" using the lease text plus the NYC rules reference below, and quotes the clause it relied on.
3. **Evidence file (small).** Add photos with a note. Each item gets a timestamp. It's grouped simply (move-in, issue, move-out). This is the Seattle lesson: the proof should exist *before* the fight.
4. **"They're charging me" (full).** Enter the charge: amount, what they say it's for, move-out date, and whether you received an itemized statement and when. The agent checks it against the deposit rules (14-day deadline, itemization, inspection offer) and drafts a firm letter demanding itemized costs and receipts. The letter cites your lease, the rule, and your evidence items.
5. **"Something broke" (small).** Describe the issue, and it drafts a repair request citing the lease and NYC habitability rules, plus a firmer follow-up if there's no response.

Priority if time runs short: 1 → 4 → 3 → 2 → 5. Items 1 and 4 must work end to end. The others may be thin.

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
