# Rental Agent: How I Got to MVP, and What's Next

**Live:** https://rental-agent-nyc.vercel.app · Detailed reasoning for every call: [product-decisions.md](product-decisions.md)

## The problem

Brokers get paid to help you find an apartment and sign. Then they disappear. Nobody is on the renter's side for the year or more they actually live there: when something breaks, when the landlord goes quiet, or when a surprise charge shows up at move-out.

I lived the last one. A landlord claimed I owed about $1,000 in repairs. I won by sending photos and demanding their paper trail (what work was done, what it cost), and they ended up owing *me*. What won wasn't arguing. It was **proof plus knowing my rights**. Most renters don't have either when they need it.

**Thesis:** brokers are paid for the transaction, but renters need help for the whole relationship.

---

## Part 1: How I got to MVP

### The full vision, and why I started at the end

| | Stage of renting | In MVP? |
|---|---|---|
| 01 | Hunt listings continuously (good NYC apartments are gone in 24–48 hrs) | Next |
| 02 | Write brokers, book showings, reschedule when they flake | Next |
| 03 | Check if you qualify before applying (40× rent, 80× guarantor) | Next |
| 04 | **Read the lease against NY law, stay with you while you rent, get your deposit back** | **✅ Built** |

I started at #04 on purpose:
- **Nobody serves it.** Search is crowded (StreetEasy, Zillow, brokers). After signing, you're alone.
- **I lived it,** so I knew what "useful" meant.
- **The lease is the foundation.** Once the agent has read your lease, every later step gets smarter, including finding your *next* place.
- **It could be real in a few hours.** #01 and #02 need listing data and outreach I can't access honestly in a take-home. Faking them is worse than skipping them.

### The decisions, in order

1. **Picked one city.** Tenant law is local, so NYC done right beats 50 states done badly.
2. **Scoped to one story:** *"My landlord is trying to keep $1,000. The agent helped me make them prove it."* Everything in v1 had to serve that.
3. **Took building vetting from the vision and built only the honest part.** HPD violation records are free, public, and automatic (the address comes from the lease). Landlord portfolios, rent stabilization, and legal-rent checks need data I can't verify yet, so I deferred them.
4. **Cut to three jobs**, then added a "works for you while you rent" home base: a timeline from the lease plus a calendar download. Real reminders, no accounts.
5. **Key architecture call: the AI reads and writes, the code decides.** Deadlines, caps, and verdicts are plain code with tests, checked against the statutes. The model only extracts lease facts and writes prose. It also can't cite any law outside a hand-verified list, and that's enforced in code, not just in the prompt. Being confidently wrong about the law was the failure mode I cared most about.
6. **Ran an independent code review before shipping.** It found five issues that would have misled a renter (for example, a missing date that quietly gave away their strongest argument). All five were fixed with tests.
7. **Deploying changed the plan.** AI Gateway's free tier needs a card on file and includes no Claude models. I switched to Gemini 2.5 Flash, a one-line change. Because the law lives in tested code, swapping the model couldn't change what the app says about the law.
8. **Using it changed the plan again.** v1 helped at the start and end of a lease, but not the 12 months in between. So I added the **rental agent chat**: a personal butler that writes friendly work orders and amenity requests, ready to send. Two deliberate calls:
   - **Friendly, not hostile.** You have to keep living with your landlord. Small fixes get neighborly requests with no legal language. For serious issues (no heat, leaks, mold), the request stays polite and the agent tells *you* your rights, privately.
   - **No fake actions.** It doesn't pretend to file or book. It writes the request, opens your email, and you hit send.
9. **Sample lease only for the demo.** The panel's 60 seconds go to the product, and I avoid inviting real leases to a public URL.

### What the MVP does

| Job | How |
|---|---|
| **Read my lease** | AI extracts the terms. Code flags what breaks NY law (2× deposit, illegal late fee, broker fee under the FARE Act), with the clause quoted and the statute linked. |
| **Be my butler** | Chat that writes friendly work orders and amenity requests, opens them in email, and adds bookings to your calendar. Answers lease questions. |
| **Know my building** | Live HPD violations by hazard class from NYC Open Data. |
| **Keep my dates** | Rent, notice deadline, lease end, and the deposit deadline, plus a calendar file. |
| **Get my deposit back** | Checks a charge against the 14-day itemization rule and writes the letter. |

**Built in about 2.5 hours** · 80 automated tests · deployed on Vercel with AI Gateway · free tier, nothing purchased.

---

## Part 2: What's next

Sequencing principle: **each step either makes the agent remember more, act more on its own, or show up earlier in the renter's journey.** That's how it goes from "helpful tool" to "the agent that stays."

### Next: make it a relationship, not a session (weeks)

| What | Why it's next | What it needs |
|---|---|---|
| **Accounts + saved rental** | Everything lives in the browser today, so clearing it loses your file. Can't "stay with you" without memory. | Auth plus a database (Vercel Marketplace: Neon or Supabase) |
| **Upload your own lease** | Already built behind the scenes and switched off for the demo. Real leases are the real test. | Privacy review, retention policy, rate limits |
| **Evidence file** | The Seattle lesson: proof should exist *before* the fight. Timestamped move-in, issue, and move-out photos, attached to letters automatically. | Private file storage (Vercel Blob, private) |
| **Request tracking + nudges** | A work order is only half the job. "Did they reply? It's been 5 days. Want me to follow up?" This is where the agent starts acting on its own. | Scheduled jobs (Vercel Cron) plus request status |
| **Real reminders** | Today you download a calendar file. Next: "your notice deadline is in 2 weeks" by email or text. | Accounts, scheduled jobs, email/SMS provider |

### Later: let it act for you (a quarter)

| What | Why | What it needs |
|---|---|---|
| **Send on your behalf, with approval** | One tap instead of copy-and-send. Trust has to be earned first, so the renter approves each send. | Email integration, approval flow, audit trail |
| **Real booking and work-order filing** | The butler's promise, fully kept. | Integrations with property-management systems (BuildingLink, AppFolio, Yardi). This is a **partnership question**, not a build question. |
| **Deeper building vetting** | Landlord track record across buildings, likely rent stabilization, whether the asking rent is legal. | Who Owns What (JustFix) partnership, DHCR rent-history requests (the agent drafts them for you) |
| **Qualification check (vision #03)** | Moves the agent earlier, to before you sign. Cheap: it's math. | Income input |
| **More cities** | Rules live in one verified module per city, so expansion is mostly legal research. | Per-city rules plus a review process |

### Vision: the whole journey (when the data exists)

**Hunt listings and book showings (vision #01–02).** This needs a licensed listing feed or partnerships, and careful outreach (a bad message in a hot market loses you the apartment). When it lands, the agent is with you from search to move-out, and it already knows what you need because it read your last lease.

### How I'd know it's working

- **Activation:** the share of visitors who get a lease read and see at least one flag.
- **The "stays" metric:** requests sent per renter per month, after the first week.
- **Outcome:** deposits recovered, and repairs fixed after a request, both self-reported at first.
- **Trust:** the rate of "the agent was wrong," and how often renters edit drafts before sending.

### Risks I'd watch

- **Legal advice line:** explaining rules vs. giving advice. Mitigated by verified rules in code, citations on everything, and clear "not legal advice" copy. A legal review comes before any scale.
- **Model accuracy on messy real leases:** the main unknown the sample hides. Mitigated by normalization, "not found in lease" instead of guesses, and an "I couldn't read this" state.
- **Landlord relationship:** the friendly default exists so the product helps renters without starting fights.
- **Privacy:** leases are sensitive. Accounts and storage need a clear retention policy before turning upload back on.
