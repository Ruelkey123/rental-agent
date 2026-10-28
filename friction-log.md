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
