# ExamForge AI — Launch-Readiness Visual Audit Report

**Date:** June 13, 2026  
**Scope:** Full UI dark-mode consistency, design-system cohesion, billing copy, and assignment detail integration.

---

## Executive Summary

A pass across all primary surfaces identified **fragmented surface/border tokens**, **ambiguous billing copy** (implied monthly resets), **inconsistent disabled search styling**, and **paper preview containers that did not match the card system in dark mode**. Fixes centralize design tokens in `globals.css`, align components to those tokens, and standardize lifetime-generation messaging.

**Screenshots:** Not captured in this session (no browser automation available). Run `npm run dev` in `frontend/` and toggle dark mode in Settings → Appearance to verify visually.

---

## 1. Inconsistencies Found

### Design tokens (dark mode)

| Issue | Location | Severity |
|-------|----------|----------|
| No canonical surface/border naming; `--surface`, `--surface-muted`, `--border-light` used interchangeably | `globals.css`, `stitch.css`, inline Tailwind | High |
| Dark mode `--surface-elevated` identical to `--surface-muted` (#302f39) — sidebar and cards looked flat | `globals.css` `.dark` | High |
| Paper preview canvas used `--surface` (same as cards) instead of recessed secondary surface | `.preview-document-canvas` | Medium |
| Difficulty pills used hardcoded light-theme greens/reds (`#15803d`, `#dc2626`) | `globals.css` | Medium |
| Theme preview swatches hardcoded hex instead of tokens | `stitch.css` | Low |
| Legacy aliases only; no `--surface-primary` / `--border-default` source of truth | `globals.css` | High |

### Assignment Detail

| Issue | Location | Severity |
|-------|----------|----------|
| Tab panel had no containing card — preview floated without border/shadow integration | `assignment-detail-tabs` | High |
| Preview action bar gradient referenced `--bg-primary` instead of panel surface | `globals.css` | Medium |
| Sidebar profile/plan blocks used inline `rounded-[10px]` + mixed token names | `sidebar.tsx`, `mobile-nav-drawer.tsx` | Medium |

### Sidebar & navigation

| Issue | Location | Severity |
|-------|----------|----------|
| Profile/plan cards duplicated border/radius/background inline instead of shared `.sidebar-shell__profile` / `__plan` rules | Sidebar components | Medium |
| Create button height not aligned to `--control-height-md` | `.create-assignment-btn` | Low |

### Global search (coming soon)

| Issue | Location | Severity |
|-------|----------|----------|
| Desktop search mixed Tailwind opacity classes with CSS module — inconsistent disabled feel | `topbar.tsx` | Medium |
| Mobile search icon lacked dedicated disabled class | `topbar.tsx` | Medium |
| Duplicate `.topbar-icon-btn:hover` overrode `:not(:disabled)` hover | `globals.css` | Medium |

### Buttons

| Issue | Location | Severity |
|-------|----------|----------|
| `outline-pill-btn`, `submit-pill-btn`, `preview-action-btn` mostly aligned but preview hover lacked `:not(:disabled)` | `globals.css` | Low |
| `create-assignment-btn` gap/padding differed from pill buttons | `globals.css` | Low |

### Typography

| Issue | Location | Severity |
|-------|----------|----------|
| No global heading rule — some headings used raw `text-[18px]` without Geist | `plan-card.tsx`, scattered | Medium |
| Body correctly uses Inter via `body { font-family: var(--font-family) }` | `globals.css` | OK |

### Billing / usage copy

| Issue | Location | Severity |
|-------|----------|----------|
| `"1 / 3 Generations Used"` — no "lifetime" qualifier | Sidebar, mobile drawer | High |
| Dashboard hero: `"N of 3 generations used"` | `home-dashboard.tsx` | High |
| Settings billing rows: generic "Assignments generated" / "Assignment limit" | `settings/page.tsx` | Medium |
| Plan cards: `"3 generations"` | `plan-card.tsx` | Medium |
| Dashboard metric: `"Remaining Generations"` without lifetime context | `dashboard-metrics-grid.tsx` | Medium |
| Upgrade modal message lacked lifetime wording | `upgrade-modal.tsx` | Medium |

### Pages audited (no structural changes required)

- **Dashboard** — metrics/hero copy updated; card tokens flow through `stitch.css`
- **Assignment Workspace** — workspace cards already tokenized via stitch; local search is functional (not global coming-soon)
- **Settings** — nav/panel tokens updated via stitch
- **Billing / Upgrade** — plan cards + copy updated
- **Library / Groups / Notifications** — feature-preview pages use `stitch.css` tokens (aliases resolve correctly)

---

## 2. Fixes Applied

### Single source of truth (`globals.css`)

Canonical tokens (light / dark):

```css
--surface-primary
--surface-secondary
--surface-elevated
--border-default
--border-subtle
```

Legacy aliases preserved for backward compatibility:

```css
--surface → --surface-primary
--surface-muted → --surface-secondary
--border-light → --border-default
```

Dark mode elevation ladder:

- Primary cards: `#25242d`
- Secondary/recessed: `#1e1d26`
- Elevated chrome (sidebar, topbar): `#2e2d38`

### Assignment detail integration

- Added `.assignment-detail-tabs__panel` card wrapper in `stitch.css`
- Preview canvas uses `--surface-secondary`; A4 paper remains print-white
- Detail-tab sticky action bar gradient uses `--surface-primary`

### Search disabled state

- `.topbar-search--coming-soon`: opacity 0.55, `cursor: not-allowed`, muted placeholder
- `.topbar-icon-btn--disabled` for mobile search button
- Removed conflicting Tailwind opacity on desktop input

### Billing copy

Centralized in `frontend/src/lib/utils/usage-label.ts`:

- Sidebar: `"1 / 3 Lifetime Generations Used"`
- Dashboard, settings, upgrade modal, plan cards — all lifetime-qualified

### Typography

- Global `h1–h6` and `.font-heading` use Geist (`--font-display`)
- Plan card title uses `font-display` class

---

## 3. Files Modified

| File | Changes |
|------|---------|
| `frontend/src/app/globals.css` | Canonical tokens, dark elevation, sidebar/profile/plan, topbar/search, buttons, preview canvas, typography |
| `frontend/src/app/stitch.css` | Token migration, assignment detail tab panel, cards/dashboard/workspace |
| `frontend/src/lib/utils/usage-label.ts` | **New** — shared lifetime usage copy |
| `frontend/src/components/layout/sidebar.tsx` | Usage label + profile/plan class cleanup |
| `frontend/src/components/layout/mobile-nav-drawer.tsx` | Usage label + profile/plan class cleanup |
| `frontend/src/components/layout/topbar.tsx` | Search disabled styling |
| `frontend/src/components/workspace/home-dashboard.tsx` | Dashboard usage label |
| `frontend/src/components/workspace/dashboard-metrics-grid.tsx` | Lifetime remaining metric |
| `frontend/src/components/settings/workspace-preferences-section.tsx` | Lifetime label |
| `frontend/src/app/settings/page.tsx` | Billing section labels |
| `frontend/src/components/billing/upgrade-modal.tsx` | Lifetime limit message |
| `frontend/src/components/billing/plan-card.tsx` | Lifetime plan limits + Geist heading |
| `docs/UI_VISUAL_AUDIT_REPORT.md` | This report |

---

## 4. Verification Checklist

Run locally with dark mode enabled:

- [ ] Sidebar plan block shows **"N / 3 Lifetime Generations Used"**
- [ ] Global search appears muted, `cursor-not-allowed`, Coming Soon badge visible
- [ ] Assignment detail → Preview tab: paper sits inside bordered card on recessed canvas
- [ ] Action bar buttons match height/radius of header Export/Duplicate buttons
- [ ] Settings → Billing rows say **lifetime**
- [ ] Upgrade page plan cards say **"3 lifetime generations"**
- [ ] Toggle light/dark — sidebar, topbar, cards maintain distinct elevation

```bash
cd frontend && npm run dev
# Open http://localhost:3000 → Settings → Appearance → Dark
```

---

## 5. Remaining Recommendations (post-launch)

1. **Migrate remaining `globals.css` references** from `--border-light` / `--surface-muted` to canonical names (aliases work today).
2. **Toast glass effect** still mixes `#ffffff` in `color-mix` — consider dark-specific toast border tokens.
3. **Mobile bottom nav** uses hardcoded `rgba(255,255,255,0.38)` — acceptable for FAB chrome but could use `--text-on-chrome` token.
4. **Screenshot regression suite** — add Playwright visual snapshots for dashboard, detail, and settings in both themes.

---

## 6. Lint Status

`npm run lint` — **pass** (1 pre-existing warning in `bulk-action-bar.tsx`, unrelated).
