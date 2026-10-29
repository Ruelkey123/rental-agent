# Rental Agent

**Brokers help you sign. Rental Agent stays.**

An agent for NYC renters that works for you *after* you sign, through the year you actually live there and the fight over your deposit at the end.

**Live:** https://app-alpha-three-29.vercel.app

## Try it in 60 seconds
1. Click **Try with a sample lease**. It's a fictional lease for a real Bronx building, with three planted problems.
2. See the clauses that break New York law, highlighted with the statute each one breaks: a 2× deposit, a $150 late fee after 1 day, and a broker fee charged to the tenant.
3. **Your rental year:** dates pulled from the lease, plus **Add to my calendar**.
4. **Your building's record:** live HPD violations from NYC Open Data.
5. **They're charging me:** check a $1,000 deduction against the 14-day itemization rule and get a ready-to-send letter.

## How it's built
- Next.js 16 on Vercel. The AI SDK goes through **Vercel AI Gateway** (Gemini 2.5 Flash, free tier).
- **The AI never decides the law.** It only reads the lease and writes letter prose. Deadlines, caps, and verdicts are plain TypeScript with tests (`app/src/lib`), checked against the statutes. Any citation outside the verified rules list (`app/src/lib/rules.ts`) is rejected in code.
- No accounts or database. The lease summary lives in your browser, and the PDF is never stored.

## Docs
- [Product decisions](docs/product-decisions.md): what I built, what I pushed to later, and why
- [Design](docs/superpowers/specs/2026-10-28-renter-agent-design.md) · [Build plan](docs/superpowers/plans/2026-10-28-rental-agent.md)
- [Friction log](friction-log.md) · [Time log](time-log.md)

Not legal advice.
