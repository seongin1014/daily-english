# Design System Strategy: The Academic Atelier (Dark Mode)

> Based on reference mockups in `stitch_daily_english_ai_tutor_dark mode/`

## 1. Overview

Dark mode extends the Academic Atelier design language into a **deep navy aesthetic**. The goal is not simply inverting colors, but creating a **"midnight study"** atmosphere — warm, focused, and easy on the eyes during extended learning sessions.

### Key Principles
- **Deep Navy, not pure black** — `#0A0E1E` base maintains brand identity
- **Warm accents preserved** — Coral (#F7543E) and Indigo (#8F7BE8) carry over
- **Tonal layering still applies** — surface hierarchy via subtle luminance shifts
- **No-Line Rule still applies** — boundaries via background color, not borders

---

## 2. Dark Mode Color Palette

### Core Surfaces
| Token | Light | Dark | Usage |
| :--- | :--- | :--- | :--- |
| `surface` | #f9f9f9 | **#0A0E1E** | Main background |
| `surfaceContainer` | #f3f3f3 | **#141829** | Default card/container |
| `surfaceContainerLow` | #ededee | **#101424** | Recessed areas |
| `surfaceContainerHigh` | #e7e8ea | **#1F1E2C** | Elevated cards |
| `surfaceContainerHighest` | #e1e2e5 | **#282838** | Highest elevation |

### Text & Icons
| Token | Light | Dark | Usage |
| :--- | :--- | :--- | :--- |
| `onSurface` | #1a1c1c | **#FFFFFF** | Primary text |
| `onSurfaceVariant` | #44474e | **#B0B0B0** | Secondary text |
| `onSurfaceDisabled` | — | **#575776** | Disabled/inactive text |
| `onBackground` | #1a1c1c | **#E8E8E8** | Body text on background |

### Brand Colors (Adjusted for Dark)
| Token | Light | Dark | Usage |
| :--- | :--- | :--- | :--- |
| `primary` | #121858 | **#8F7BE8** | Headers, active tab icons |
| `primaryContainer` | #1a237e | **#2A2460** | Selected states, badges |
| `onPrimary` | #ffffff | **#FFFFFF** | Text on primary |
| `secondary` | #ac3509 | **#F7543E** | CTA buttons, accents |
| `secondaryContainer` | — | **#3D1A12** | Secondary button bg |
| `onSecondary` | #ffffff | **#FFFFFF** | Text on secondary |

### Semantic Colors
| Token | Light | Dark | Usage |
| :--- | :--- | :--- | :--- |
| `success` | #16a34a | **#4ADE80** | Correct answers, positive |
| `successContainer` | #f0fdf4 | **#1A3D2A** | Success background |
| `error` | #ba1a1a | **#FF6B6B** | Wrong answers, errors |
| `errorContainer` | #ffdad6 | **#3D1A1A** | Error background |
| `warning` | #F59E0B | **#FBBF24** | Warnings |

### Utility
| Token | Light | Dark | Usage |
| :--- | :--- | :--- | :--- |
| `outline` | #74777f | **#3A3A4A** | Borders (ghost) |
| `outlineVariant` | #c4c6d0 | **#2A2A3A** | Subtle dividers |
| `shadow` | rgba(26,28,28,0.06) | **rgba(0,0,0,0.3)** | Ambient shadow |
| `inverseSurface` | #2f3033 | **#E8E8E8** | Snackbar, tooltip bg |
| `inverseOnSurface` | #f0f0f4 | **#1A1A2E** | Text on inverse |

---

## 3. Screen-Specific Dark Mode Notes

### Home Dashboard
- Background: `surface` (#0A0E1E)
- Streak counter card: `surfaceContainerHigh` (#1F1E2C) with coral accent
- "Start Learning" button: `secondary` (#F7543E)
- Stats cards: `surfaceContainer` (#141829)

### Recordings List
- Cards: `surfaceContainer` (#141829)
- Date headers: `onSurfaceVariant` (#B0B0B0)
- Insight banner: indigo gradient (`primaryContainer` -> `primary`)

### Recording Screen (Always Dark)
- Keeps its own dark palette (`#0A0A1A` base)
- Theme tokens replace hardcoded values but visual result unchanged
- Mic button: `secondary` (#F7543E) with glow shadow

### Recording Detail
- Sentence cards: `surfaceContainerHigh` (#1F1E2C)
- Korean text: `onSurface` (#FFFFFF)
- English text: `onSurfaceVariant` (#B0B0B0)

### Study Hub
- Mastery rings: cyan/orange/purple (fixed accent colors)
- Stats cards: `surfaceContainer` (#141829)
- Donut chart background: `surfaceContainerHigh`

### Flashcard
- Background: indigo gradient (deep `#0A0E1E` -> `#1A1040`)
- Card face: `surfaceContainerHigh` (#1F1E2C)
- Action buttons: `surfaceContainer` with icon tints

### Quiz (Multiple Choice)
- Correct answer: `success` (#4ADE80) border + `successContainer` bg
- Wrong answer: `error` (#FF6B6B) border + `errorContainer` bg
- Default option: `surfaceContainer` (#141829)
- "Continue" button: `secondary` (#F7543E)

### Quiz (Fill in Blank)
- Input field: `secondary` (#F7543E) border when focused
- Submit button: `secondary` (#F7543E)

### Settings
- Section groups: `surfaceContainer` (#141829)
- Profile card: `surfaceContainerHigh` (#1F1E2C)
- Toggle active: `secondary` (#F7543E)

---

## 4. Tab Bar (Dark)
- Background: `surface` (#0A0E1E) with subtle top border `outline` at 15% opacity
- Active icon: `primary` (#8F7BE8)
- Active label: `primary` (#8F7BE8)
- Inactive icon/label: `onSurfaceDisabled` (#575776)

---

## 5. Do's and Don'ts (Dark Mode Specific)

### Do:
- Use deep navy (#0A0E1E), not pure black (#000000)
- Increase contrast for primary text — white (#FFFFFF) on dark surfaces
- Use lighter accent variants — Coral becomes #F7543E, primary becomes #8F7BE8
- Preserve card hierarchy — subtle luminance steps between surface levels

### Don't:
- Don't invert the recording screen — it stays dark in both modes
- Don't use light mode shadows — use darker, more diffuse shadows
- Don't reduce spacing — maintain the same generous padding as light mode
- Don't use pure white backgrounds — no element should be #FFFFFF background
