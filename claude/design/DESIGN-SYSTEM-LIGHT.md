# Design System Strategy: The Academic Atelier (Light Mode)

> Original source: `stitch/scholar_indigo/DESIGN.md`

## 1. Overview & Creative North Star
The North Star for this design system is **"The Academic Atelier."** 

We are moving away from the "gamified" chaos of typical language apps and toward a space that feels like a premium, private library—focused, serene, and intellectually stimulating. This system rejects the "template" look of standard mobile grids in favor of a **High-End Editorial** layout. 

To achieve this, we prioritize **Intentional Asymmetry** and **Tonal Depth**. Instead of centering everything, we use staggered typography and overlapping card elements to create a sense of movement. We avoid rigid boxes, choosing instead to let content "breathe" within sophisticated, layered surfaces that feel more like fine stationery than a digital screen.

---

## 2. Color & Tonal Depth

### The "No-Line" Rule
Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts.

### Surface Hierarchy & Nesting
- **Base Layer:** `surface` (#f9f9f9)
- **Secondary Containers:** `surfaceContainerLow` (#f3f3f3)
- **Priority Elements:** `surfaceContainerLowest` (#ffffff)

### The "Glass & Gradient" Rule
Glassmorphism for floating UI — `surface` tokens with 70% opacity and 20px backdrop blur.
- **Signature Texture:** Subtle linear gradient from `primary` (#121858) to `primaryContainer` (#1a237e) for CTAs.

---

## 3. Typography: The Editorial Voice
- **Display (Manrope):** Daily Streaks, milestones. Letter-spacing -2%.
- **Headline (Manrope):** Lesson titles. `headline-lg` (2rem).
- **Body (Inter):** Learning content. `body-lg`. High x-height for Korean/English balance.
- **Labels (Inter):** Micro-data. `label-md` with +5% letter-spacing.

---

## 4. Elevation & Depth: Tonal Layering
- **Layering Principle:** `surfaceContainerLowest` card on `surfaceContainerLow` background.
- **Ambient Shadows:** 6% opacity of `onSurface`, 24-32px blur, 0px spread.
- **Ghost Border Fallback:** `outlineVariant` at 15% opacity for accessibility.

---

## 5. Components
- **Primary CTA:** `secondary` (#ac3509), `xl` roundedness.
- **Secondary Actions:** `primaryFixed` (#e0e0ff) with `onPrimaryFixed` text. No borders.
- **Cards:** No divider lines. 16px gap or alternating backgrounds.
- **Progress Indicators:** `secondary` Warm Coral on `outlineVariant` track at 30% opacity.
- **Focus Plate:** Signature translation card with 4px `primary` accent bar on left edge.

---

## 6. Do's and Don'ts

### Do:
- Embrace Negative Space (24px edge padding)
- Use Asymmetric Grids
- Prioritize Hangul/English Balance (line-height >= 1.6)

### Don't:
- Don't use Pure Black — use `tertiary` (#111d23) or `onSurface`
- Don't use standard Material Blue — use `primary` Deep Navy
- Don't use sharp corners — minimum `md` (0.75rem) roundedness

---

## 7. Design Tokens Reference (Light)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `primary` | #121858 | Brand authority, key headers |
| `primaryContainer` | #1a237e | Selected states, gradient end |
| `onPrimary` | #ffffff | Text on primary |
| `secondary` | #ac3509 | High-energy CTAs |
| `surface` | #f9f9f9 | Main background |
| `surfaceContainerLow` | #f3f3f3 | Section grouping |
| `surfaceContainerLowest` | #ffffff | Active cards, inputs |
| `onSurface` | #1a1c1c | Primary text |
| `onSurfaceVariant` | #44474e | Secondary text |
| `outline` | #74777f | Borders |
| `outlineVariant` | #c4c6d0 | Subtle borders |
| `surfaceTint` | #4c56af | Press states |
| `primaryFixed` | #e0e0ff | Secondary action bg |
