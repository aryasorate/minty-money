# Minty Money — Proof of Concept

> **"Smart, Simple, Student-First."** A money *coach* for Indian college students — not just another expense tracker.

This repository contains a working desktop-web prototype of Minty Money, built to demonstrate the product's value and feasibility to an evaluation committee. It covers the core experience from the pitch deck: Money Jars, auto-detected expenses, split bills, goals, smart alerts, personalised insights and Smart Money courses — all on realistic, internally consistent data for four student personas.

---

## Quick start

**Requirements:** Node.js 20+ (built and tested with Node 26 LTS) and npm.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` (static files, host anywhere) |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript type-check |

**Environment variables:** none. **External services / API keys:** none. Everything runs in the browser; state is saved in `localStorage`.

**Browser:** a desktop browser (Chrome/Edge recommended) at 1280 px width or more.

---

## What's in the prototype

| Area | What you can do | Deck slide |
|---|---|---|
| **Profile picker** | Explore the app as Arjun, Ankit, Priya or Kunal (the deck's personas), each with ~6 months of consistent history | User personas |
| **Onboarding** | 4 steps: welcome → income sources → split into jars (with Auto-split) → enable SMS reading & link bank | Roadmap: core onboarding |
| **Dashboard** | Left this month, fixed vs variable, savings rate; jar donut; weekly spending pattern; smart alerts; streak; priority goal; recent transactions | Dashboard |
| **Money Jars** | Budget / spent / left per jar, Add ₹100, Spend, Rebalance, Auto-split, Customise, Save to savings jar, bills with "Pay now", filterable transactions | Money Jars |
| **Auto-detect** | A bank SMS arrives → it is parsed → "Alert: Expense detected — categorise now" pop-up with a suggested category → one tap logs it. Credit SMS triggers "Your side income is in — transfer a portion to savings?" | Auto-Detect & Categorise |
| **Split Bills** | Split a bill equally with friends/groups, see who paid & who's pending, friend balances (netted), settle up, in-app reminders, add friends, create groups | Split Bills |
| **Goals** | Multiple goals, progress bars, auto-calculated monthly target, priority goal, add money, milestone celebrations (25/50/75/100%) | Goals |
| **Insights** | "Minty AI" summary, category performance vs last month, what-if scenarios (→ set as goal), impact analysis, smart predictions with confidence, 6-month trends, savings trend, you vs typical students | Insights |
| **Alerts** | Budget warnings, Peer Pressure Protector, predicted run-outs, bills due, money owed, goal nudges, wins, streaks, filters, mark as read, personalised money hacks, badges | Alerts |
| **Learn** | 4 "Smart Money" courses (12 bite-sized lessons) with the ₹9/month badge, lesson progress and a badge for completion | Smart Money ₹9 |
| **Gamification** | Within-budget streaks, 8 badges, confetti on milestones | Savings motivation |
| **Demo panel** | Presenter tools: send a simulated bank SMS (presets or paste your own), jump to mid-month, next day, reset | — |

### What is real vs simulated

| Genuinely implemented | Simulated for the PoC |
|---|---|
| SMS **parsing** (amount, debit/credit, merchant, account, bank) and **categorisation** of common Indian bank/UPI formats | The SMS **source** — in a real app it comes from the phone's inbox; here it comes from the Demo panel |
| Every number on every screen — calculated live from the transaction list | Transaction **history** — synthetic, generated deterministically per persona |
| Run-rate predictions + confidence, alerts engine, what-ifs, peer benchmarks, streaks, badges | "Minty AI" branding — it is a transparent rule-based engine, **not** an ML/LLM model |
| Split-bill maths (equal split, pairwise net balances, settle up) | Reminders (shown as a toast; no message is actually sent). No payment requests (by design) |
| Goals maths (monthly target, milestones) | Bank linking (Account Aggregator) — an animation in onboarding |
| Lesson content and progress | ₹9/month Smart Money subscription — cosmetic only; no checkout or paywall |
| Persistence across reloads (localStorage) | "Typical student" peer values — synthetic reference numbers |

Simulated elements are tagged **SIMULATED** / **PRESENTER TOOLS** in the UI.

---

## How it works

- **Stack:** Vite · React 19 · TypeScript · Tailwind CSS v4 · Recharts · Zustand (persisted) · lucide-react · date-fns · canvas-confetti. Hash-based routing so the build can be hosted on any static host (e.g. GitHub Pages).
- **No backend, by design.** All state lives in one Zustand store, saved per persona in `localStorage`. Screens read from pure engine functions, so a real API could replace the store without touching the UI.
- **Demo clock.** Each persona has its own "today" (starts on the 10th of the current month). Every calculation uses it. *Jump to mid-month* simulates that persona's typical spending for the skipped days and auto-pays bills that fall due — this is what makes predictions and alerts evolve during a demo.
- **Deterministic data.** The generator (`src/data/generator.ts`) uses a seeded PRNG per persona + date, so every reset produces exactly the same data.

```
src/
  app/          App shell (sidebar, top bar) and routes
  components/   UI primitives and shared widgets
  features/     One folder per screen (dashboard, jars, split, goals, insights, alerts, learn, onboarding, autodetect, demo, profiles)
  engine/       Pure calculation modules: money, predictions, insights, whatif, alerts, goals, split, sms, gamification
  data/         Types, catalog (jars, tags, peer values), personas, generator, lessons
  store/        Zustand store and toasts
  lib/          Formatting (₹), dates, PRNG, ids
docs/PLAN.md    Requirements, plan, decisions log, progress, known issues
```

---

## Recommended demo walkthrough (≈ 8–10 min)

> Before presenting: open the app, click **Reset all demo data** on the profile picker, and use a desktop window ≥ 1280 px wide. The **Demo** button (top-right) opens presenter tools.

1. **Profile picker (30 s)** — "Four real student archetypes from our research. Each has six months of realistic data."
2. **Ankit, The Hustler — onboarding (1.5 min)** — Click Ankit → walk through income sources (allowance + stipend + irregular freelance) → *Auto-split* into jars → enable SMS → *Link bank* → open the dashboard. Point at *Left this month*, savings rate and the weekly pattern.
3. **Ankit — side income (1 min)** — Demo → **₹5,000 freelance payment**. The credit SMS is parsed and Minty asks *"Transfer a portion to savings?"* → move 20% to **New Laptop**. Show the goal moving on the dashboard.
4. **Kunal, Digital-Savvy Saver — auto-detect (1.5 min)** — Switch student → Kunal → Skip setup. Demo → **₹40 chai (UPI)** → pop-up suggests *Snacks & Chai* → one tap. Then **Insights** → *You vs typical students* (snacks well above typical) → a *What-if* card "Weekly snack cap" → **Set as goal**.
5. **Priya, Social Butterfly — split & nudge (2 min)** — Switch to Priya → **Split Bills** → "Pizza night", ₹1,200, Weekend Squad → Split. Show who's pending + Remind. Then Demo → **Jump to mid-month** → Dashboard/Alerts: **Peer Pressure Protector** (Food budget > 80%) and the prediction *"Fun & Social runs out by the 25th"*. Optionally add money to her Goa goal to trigger a milestone celebration.
6. **Arjun, The Struggler — rent (1 min)** — Switch to Arjun → Split Bills: **PG Rent – Room 204** shows Rohan paid, Sameer pending → Remind / mark as paid. Alerts show the Jio recharge due and the predicted food run-out ("allowance gone early").
7. **Learn & close (30 s)** — Learn → Smart Money courses at ₹9/month → open *Budgeting 101*. Close on the vision: *a coach, not a tracker*.

### Definition of done for the PoC

- All must-have features work for all four personas.
- The walkthrough above runs end-to-end from a fresh reset without errors at 1366 px and 1920 px widths.
- Numbers are consistent across Dashboard, Jars, Insights and Alerts.
- Simulated parts are clearly labelled.

---

## Known issues & limitations

- **Desktop only.** Layout targets ≥ 1280 px; it is not optimised for phones.
- **Local data.** Everything is in the browser's `localStorage`; clearing site data or using a private window starts fresh. Data is per browser.
- **SMS parser coverage.** Handles common Indian bank/UPI phrasing (debited/credited/spent/paid/sent, Rs/INR/₹, VPA handles); unusual formats may not parse (the Demo panel shows a warning).
- **Forecasts are simple.** Predictions use the current month's run-rate; confidence is a heuristic based on days of data and spending volatility.
- **Peer benchmarks are synthetic** (`TYPICAL_MONTHLY` in `src/data/catalog.ts`).
- **Split bills** support equal splits only; reminders don't leave the app.
- **The demo clock only moves forward** within the current month; use *Reset* to start again.
- When a user pays a shared bill, only their own share is logged as their expense (the rest is treated as money owed to them).
