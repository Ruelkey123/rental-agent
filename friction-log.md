# Vercel Friction Log

**Project:** [Rental Agent](https://rental-agent-nyc.vercel.app), an agent for NYC renters. Next.js 16 on Vercel, AI SDK 7 through AI Gateway, NYC Open Data.
**How I built it:** with Claude Code writing the code. I did the Vercel steps myself in the dashboard (import, settings, domains, AI Gateway) so I'd experience the product as a user.

**Key:** 🔴 blocked me · 🟡 slowed me down or confused me · 🟢 worked really well · 💡 surprised me

---

## The three things that stood out

1. **The first real AI request hit two walls, and both were invisible until after I deployed.** AI Gateway's "free" credit needs a credit card on file. Once I added one, the free tier didn't include the model I'd built on. The dashboard never warned me about either; I found both in the function logs. *(Entries 1 and 2)*
2. **A sensible default gave a bad result on a common setup.** Setting Root Directory to `app` named my project "app" and gave it `app-alpha-three-29.vercel.app`. Renaming didn't fix the URL, and part of the dashboard kept showing the old name. *(Entry 3)*
3. **The happy path is great, and increasingly built for agents, not just me.** Push to deploy in about 30 seconds, zero-config AI auth on Vercel, a one-line model swap. Vercel also ships tooling that lets a coding agent run the entire deploy, which made me ask who the dashboard is for now. *(Entries 7–10)*

---

## AI Gateway

### 1. 🔴 "Free" AI Gateway credit needs a credit card before the first request
- **Trying to:** use AI Gateway's free tier from my deployed app. On Vercel the app signs in automatically (OIDC), so no API key was needed.
- **What happened:** the live lease reader failed instantly (HTTP 502 in about 1 second). My app only shows a friendly error, so I checked the function logs: *"AI Gateway requires a valid credit card on file to service requests. Please visit … to add a card and unlock your free credits."*
- **What I expected:** the Get Started page says "Free AI Gateway Credit includes $5 each month." The card sentence ("Card verification is required, but your card won't be charged") sits right after the *Buy Paid AI Gateway Credit* link, so I read it as applying to paid credit only. The assignment also says I shouldn't need to buy anything. Nothing before deploying told me free requests would be refused without a card.
- **The bigger issue is having to hand over a card at all.** "Free" plus "give us your credit card" is a trust ask, and it landed at the worst moment: mid-build, already deployed, just wanting to see my app work. Even with "won't be charged," I stopped to think: will it auto-upgrade? Is there a cap? What if I forget about it? For a student, a hobbyist, or anyone kicking the tires, that pause is where people leave, or quietly switch to a provider whose free key doesn't need a card. It turns a product decision into a personal-finance decision.
- **How I moved forward:** added a card. Total detour: about 10 minutes, including finding the reason in the logs.
- 🟢 **What worked:** the error message itself is excellent. It says exactly what's wrong and links straight to the fix. It's just only visible in logs, after the fact.
- **What I'd want:** let the free $5 work without a card (rate-limited if needed), and ask for one at upgrade. Or, if a card is needed for abuse prevention, say so upfront and say why, as step 1 on Get Started, or as a banner on the project when a deployment calls AI Gateway with no card on file.
- Screenshot: `screenshots/ai-gateway-get-started.png`

### 2. 🟡 After adding the card: "Free tier users do not have access to this model"
- **What happened:** the next request failed with a new log line: *"Free tier users do not have access to this model."* I'd built on Claude Sonnet 5.5. The free tier includes **no Claude models at all**.
- **What I expected:** to know which models are free *before* choosing one. The models API (`/v1/models`) has no free-tier field. The docs link to a filtered web page, and I ended up pulling the free list out of that page's source.
- **How I moved forward:** switched to `google/gemini-2.5-flash` (free tier, reads PDFs, supports structured output). 🟢 It was a one-line change. A single `provider/model` string made the swap painless, and that's AI Gateway's core promise working exactly as advertised.
- **What I'd want:** an `availableToFreeTier` field in `/v1/models`, and a "Free" badge next to model names on the Get Started page, in the docs, and in the model list.

### 3. 🟡 Get Started assumes an API key, even for apps deployed on Vercel
- **What happened:** the page's steps are: 1) create an API key, 2) buy credit, 3) export the key. But my deployed app didn't need a key, because Vercel authenticates it automatically (OIDC). The page doesn't mention that.
- **Why it matters:** a first-timer would likely create a key and paste it into project settings for nothing. That's one more secret to manage, when the zero-config path is actually the better one.
- **What I'd want:** a branch at the top: "Deploying on Vercel? You don't need a key." For local dev: "run `vercel env pull`."
- 💡 The first thing on the page is an **"Agent Prompt"** to paste into your coding tool, above the human steps. See entry 10.

---

## Deploying

### 4. 🟡 Project named after the subfolder, not the GitHub repo, and the URL stuck
- **Trying to:** import my repo `rental-agent`. The app lives in a subfolder, so I set Root Directory to `app`.
- **What happened:** Vercel named the project **"app"** and assigned `app-alpha-three-29.vercel.app`. I renamed it to "rental-agent" in Settings → General. The name changed, but **the URL didn't**. Then the project switcher on the AI Gateway page still said **"app"** after a refresh. I only trusted the rename after checking with `vercel project ls`, which showed one project, correctly named.
- **What I expected:** the name comes from the **repo** (`rental-agent`), which I'd already chosen. A folder called `app` says nothing about the product. If I rename, I'd expect the default URL to follow, or at least a prompt: "Update your URL too?"
- **How I moved forward:** added `rental-agent-nyc.vercel.app` in Settings → Domains (`rental-agent.vercel.app` was taken). That took about 10 minutes across rename, confusion, and domain.
- **Why it matters:** apps in an `app/` or `web/` subfolder, or in a monorepo, are common, and the bad URL is the one you share first. A small fix: default to the repo name, and show the project-name field next to Root Directory so you see the result before deploying.
- Screenshot: `screenshots/stale-project-name-after-rename.png`

### 5. 🟡 `vercel logs --level error` returned nothing for an error
- **Trying to:** find out from the terminal why `/api/lease` was returning 502.
- **What happened:** `vercel logs --level error --since 10m` said "No logs found." The same command without `--level` showed the line, labeled **error**.
- **What I expected:** filtering by error level shows error-level lines. It may filter on the request rather than the log line, but nothing says so.
- **How I moved forward:** dropped the filter.

---

## Building with Next.js

### 6. 🟡 The dev server kept serving old CSS after I changed the design
- **What happened:** after replacing the global stylesheet and fonts, the page still rendered the starter styles. Restarting `next dev` didn't help; the compiled CSS still contained the starter page's classes.
- **What I expected:** hot reload, or at least a restart, picks up a changed CSS file.
- **How I moved forward:** deleted the `.next` build cache and restarted. That cost about 5 minutes, and a newer developer would probably assume their own code was broken.

### 7. 💡 New Next.js projects include instructions for AI coding tools
- `create-next-app` adds an `AGENTS.md` telling coding agents "This is NOT the Next.js you know," pointing them to docs bundled in `node_modules`. It paid off right away: my AI tool learned that Cache Components is on by default (which removes some older route settings) before writing code that would have broken. A clear sign Next.js is designing for AI-assisted development.

---

## What worked really well

### 8. 🟢 Push to deploy is fast enough to iterate live
- Every `git push` was live on production in about 25–35 seconds. I shipped about eight fixes to production in one sitting (model swap, copy changes, the chat feature), each verified on the real URL within a minute.

### 9. 🟢 Zero-config AI auth on Vercel, once the card was sorted
- No API key in my project settings at all. The deployment authenticated to AI Gateway on its own. For local testing, `vercel link` plus `vercel env pull` gave me a short-lived token in seconds, with nothing secret committed.

### 10. 💡 Vercel can be driven entirely by an agent. So who's the user?
- My Claude Code setup includes Vercel's plugin, which can create the project, deploy, set env vars, and read logs from the terminal. I chose to do the Vercel steps by hand to experience the dashboard. But the signals are everywhere: an **Agent Prompt** at the top of AI Gateway's Get Started page, `AGENTS.md` in every new Next.js app, and a CLI with `--non-interactive` modes for agents.
- **What I noticed:** the friction I hit lived in the gaps between the two paths. The agent path would have hit the same card and free-tier walls, but a human in the dashboard was the one who had to add the card, and the dashboard was where the stale project name lived. As more deploys are done by agents, the moments that *need* a human (billing, trust, naming the thing) are where the dashboard should be clearest.

---

**Time lost to friction:** about 25–30 minutes total, mostly entries 1, 2, and 4.
