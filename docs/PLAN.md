# Minty Money PoC — Plan & Progress

> Living document. Keep it updated so work can resume across sessions.

## 1. Agreed requirements (Phase 1)

**Goal:** a reliable, polished **desktop web** prototype that shows Minty Money's value: a money *coach* (guidance, not just tracking) for Indian college students. Lives in a GitHub repo; hosting is decided later.

**Conflict rules**
- Deck **text** beats deck screenshots; feature slides + user journeys define scope; the roadmap slide is the product timeline, not a PoC constraint.
- **Visual identity** follows the deck's app screenshots (light, green accents, white cards). Not pixel-perfect.
- Screenshot numbers and market-data slides are ignored; one consistent synthetic dataset is used.

**Decisions from the interview**
| Topic | Decision |
|---|---|
| Platform | Desktop website (not phone-sized) |
| SMS reading | Faked source (demo panel); real parsing + categorisation |
| "AI" predictions | Rule-based "mock AI" (run-rate forecast + confidence); documented as non-ML |
| Split bills | No automatic payment requests; in-app reminders only |
| Bank linking | Mocked step in onboarding |
| ₹9 Smart Money | Per-month subscription, **purely cosmetic** (no checkout, no paywall) |
| Users | No login; profile picker with 4 personas (Arjun, Ankit, Priya, Kunal); state persisted; "Reset demo" |
| Onboarding | Short 4-step flow (income → jars → connect → done) |
| Demo panel | Fake SMS, side-income credit, jump to mid-month, reset |
| Gamification | Light: streaks, milestone celebrations, badges. Savings circles out of scope |
| Persona naming | "Kunal" used consistently; Arjun's "no bank account" detail dropped |

## 2. Feature scope

**Must-have:** profile picker + reset · onboarding · dashboard · money jars · SMS auto-detect + categorise pop-up · split bills · goals · alerts · insights (category performance, 6-month trends, what-ifs, predictions, peer benchmark) · demo panel.
**Nice-to-have:** Learn (4 courses with ₹9 badge) · badges · confetti · "Minty AI is analysing" shimmer.
**Out of scope:** real SMS/bank/UPI/payments, payment requests, auth, real LLM, savings circles, mobile layout, hosting, automated tests, market data.

## 3. Architecture

- **Stack:** Vite + React 19 + TypeScript, Tailwind CSS v4, Recharts, Zustand (with `persist` → localStorage), lucide-react, date-fns, canvas-confetti. HashRouter (static-host friendly).
- **No backend by design.** All state lives in a Zustand store persisted per persona. Pure engine functions compute everything from the transaction list, so a real API could replace the store later.
- **Demo clock:** each profile has a `demoDate` (starts on the 10th of the real current month). All calculations use it. "Jump to mid-month" simulates the persona's typical spending for the skipped days (deterministic PRNG seeded by persona+date) and auto-pays due bills.
- **Synthetic data:** `src/data/generator.ts` builds ~6 months of history from per-persona spending patterns in `src/data/personas.ts`.
- **Engine (`src/engine/`):** `money` (month stats, jars), `predictions` (run-rate + confidence), `insights` (category change, trends, benchmarks), `whatif`, `alerts` (rule engine), `goals`, `split` (pairwise balances), `sms` (parser + categoriser), `gamification` (streaks, badges).

```
src/
  app/          shell, sidebar, top bar, routes
  components/   ui primitives, shared widgets
  features/     one folder per screen
  engine/       pure calculation modules ("mock AI")
  data/         types, catalog, personas, generator, lessons
  store/        zustand store, toasts
  lib/          formatting, dates, rng, ids
```

## 4. Milestones & progress

| # | Milestone | Status |
|---|---|---|
| M0 | Setup: Node LTS, Vite/React/TS, Tailwind, git, docs | ✅ done |
| M1 | Foundation: shell, UI kit, store, seed data, demo clock, profile picker, reset | ✅ done |
| M2 | Dashboard + Money Jars | ✅ done |
| M3 | Engine + Auto-detect + Alerts + Demo panel | ✅ done |
| M4 | Split Bills + Goals | ✅ done |
| M5 | Insights + Learn + Gamification | ✅ done |
| M6 | Onboarding + polish + README + demo script | ✅ done |

### Manual verification log (2026-11-25, 1440×900, Chrome-based pane)
- Profile picker → onboarding (all 4 steps, auto-split, simulated bank link) → dashboard ✅
- Ankit: ₹5,000 freelance SMS → income prompt → 20% to New Laptop; balance & savings rate update ✅
- Kunal: ₹40 chai SMS → pop-up suggests Snacks & Chai (93%) → one tap logs it ✅; peer benchmark shows snacks +33% vs typical ✅
- Priya: split ₹1,200 pizza 4 ways → balances net per friend ✅; jump to 18th → Peer Pressure Protector (food > 80%) + "Fun runs out by the 25th" ✅; goal contribution → 25% milestone confetti ✅
- Arjun (engine check): rent split with Sameer pending, Jio bill due alert, food predicted to run out ~20th ✅
- Jars, Alerts (filters, mark read), Insights (charts, what-ifs, predictions), Learn (lesson flow) render without console errors ✅
- `npm run typecheck` and `npm run build` pass ✅

### Pending / ideas (not started)
- Hosting (GitHub Pages / Vercel) — deferred by agreement.
- Optional: "create your own profile" from blank; unequal bill splits; persona-specific merchant name prettifying for more UPI handles.

## 5. Decisions log

- 2026-11-25 — Node.js 26 LTS installed via winget (approved).
- 2026-11-25 — Frontend-only SPA; localStorage persistence; HashRouter.
- 2026-11-25 — Jar ids are fixed across personas (`rent, food, travel, academics, fun, other, savings`) so the engine can reason about them; sub-categories are "tags".
- 2026-11-25 — When the user pays a split bill, only *their share* is logged as their expense; the rest is a receivable.
- 2026-11-25 — Category performance compares month-to-date vs the *same days* of last month (fairer than full-month vs partial).
- 2026-11-25 — Generator uses a cumulative-expected-count scheme (random phase per month) instead of per-day coin flips, so monthly totals track each persona's intended rate; the current month uses no random month/tag factors so each persona's story beats land reliably (Priya > 80% food by the 18th, Kunal snacks ≈ +30% vs typical, Arjun food runs out ≈ 20th).
- 2026-11-25 — Peer benchmarks use the user's average month over the last 3 full months (steadier than last-30-days).
- 2026-11-25 — Demo panel closes on Escape / navigation; picking a profile or finishing onboarding always lands on the dashboard.

## 6. Known issues / limitations

- Data lives in the browser's localStorage; clearing site data resets everything.
- SMS parser covers common Indian bank/UPI formats, not all.
- Peer benchmarks use synthetic "typical student" values (`TYPICAL_MONTHLY` in `src/data/catalog.ts`).
