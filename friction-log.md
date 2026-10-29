# Vercel Friction Log

Format for each entry:
- **When / what I was trying to do**
- **What happened**
- **What I expected instead**
- **How I moved forward**
- **Tag:** 🔴 blocked · 🟡 slowed me down / confused me · 🟢 worked really well · 💡 surprised me

Screenshots go in `./screenshots/`.

---

## Entries

<!-- newest at the bottom; jot it down the moment it happens, polish later -->

### Draft entries from the build (Alex: keep, rewrite in your words, or cut)

**🟡 Next.js dev server served stale CSS after edits (Next 16.4, Turbopack)**
- **Trying to:** see the new design after replacing `globals.css` and the layout fonts.
- **What happened:** the page kept rendering the old stylesheet (Arial, no custom colors). Restarting `next dev` didn't fix it. The compiled CSS still had the starter page's classes.
- **Expected:** hot reload, or at least a restart, picks up a changed CSS file.
- **How we moved forward:** deleted the `.next` folder (the build cache) and restarted. Cost about 5 minutes. A first-time user would likely blame their own code.

**💡 create-next-app ships an AGENTS.md telling AI tools "This is NOT the Next.js you know"**
- New projects include a file pointing coding agents at the bundled docs in `node_modules/next/dist/docs`. Useful: it's how we found that `cacheComponents` is on by default, which removes `revalidate` route config. A clear signal Vercel is designing for AI-assisted development.

### Deploying

**🟡 Project named after the subfolder, not the GitHub repo**
- **Trying to:** import my GitHub repo `rental-agent` into Vercel. The Next.js app lives in a subfolder, so I set Root Directory to `app`.
- **What happened:** Vercel named the project **"app"** and gave it the address `app-alpha-three-29.vercel.app`. I renamed the project to "rental-agent" in Settings → General. The name changed, but **the URL stayed `app-alpha-three-29`**. To get a clean address I had to add a domain by hand.
- **What I expected:** the project name comes from the **GitHub repo name** (`rental-agent`), which is what I'd already named it. A subfolder called `app` says nothing about what the project is. If I do rename, I'd expect the default `.vercel.app` URL to follow, or at least a prompt asking "update your URL too?"
- **How I moved forward:** renamed in Settings → General, then added a domain in Settings → Domains.
- **Then:** after the rename, the project switcher at the top of the AI Gateway page still said **"app"**, even after a refresh. The CLI (`vercel project ls`) showed only one project, correctly named `rental-agent`. So the rename worked, but part of the dashboard kept the stale name. That made me doubt whether the rename had saved at all.
- **Why it matters:** monorepos and `app/` or `web/` subfolders are common, so this default probably catches a lot of people. And the bad URL is the one you share first. The fix seems small: default to the repo name, and show the name field next to Root Directory so you see the result before you deploy.
- Screenshots: `screenshots/stale-project-name-after-rename.png` (header still says "app")

**🔴 "Free" AI Gateway credit needs a credit card before the first request**
- **Trying to:** use AI Gateway's free tier from my deployed app. The app authenticates automatically via Vercel's OIDC token, so no API key was needed.
- **What happened:** the live lease reader failed instantly (HTTP 502 in 1.4s). The app only shows a friendly error, so I checked the function logs: *"AI Gateway requires a valid credit card on file to service requests. Please visit … to add a card and unlock your free credits."*
- **What I expected:** the dashboard says "Free AI Gateway Credit includes $5 each month." The card sentence right after it ("Card verification is required, but your card won't be charged") sits next to the *Buy Paid Credit* link, so I read it as applying to paid credit only. The assignment also says you shouldn't need to buy anything. Nothing told me before deploying that free requests would be refused without a card.
- **How I moved forward:** [fill in: added a card / switched provider]
- **What worked well 🟢:** the error message itself is excellent. It says exactly what's wrong and includes a direct link to fix it. The problem is that you only see it in the logs, after deploying.
- **Suggestion:** put "add a card to activate free credit" as an explicit step 1 on the Get Started page, or show a banner on the project when a deployment calls AI Gateway with no card on file.

**🟡 `vercel logs --level error` returned nothing for an error**
- **Trying to:** find why `/api/lease` returned a 502, from the CLI.
- **What happened:** `vercel logs --level error --since 10m` said "No logs found." The same command without `--level` showed the line, labeled `error`.
- **Expected:** filtering by error level shows error-level lines. (Possibly it filters on the request's status or level rather than the log line's level, but that isn't obvious.)
- **How I moved forward:** dropped the filter.
