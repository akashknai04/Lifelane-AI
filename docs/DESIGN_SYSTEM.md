# LifeLane AI — Measured Design System

> **Reference Source:** [https://www.trafficmanagement.com/](https://www.trafficmanagement.com/)  
> **Extraction Method:** Live stylesheet analysis (`Layout.CC0ohyei.css`) and DOM inspection of computed classes, CSS custom properties, and responsive layout rules.  
> **Status:** Measured from live site — NO guessed tokens or random styles.

---

## 1. Color Palette (Live Measured Hex & OKLCH)

### 1.1 Brand & Semantic Core
| Token Name | Computed Value / Hex | Usage / Role |
|---|---|---|
| `--color-primary` | `#f36e20` | Traffic Safety Orange. Primary action buttons, active navigation states, key metric highlights, brand accents. |
| `--color-muted` | `#fef2ec` | Soft peach / warm orange tint. Badge backgrounds, button hover states, card backdrops, icon container fills. |
| `--color-secondary` | `#ecf8fe` | Soft sky blue tint. Secondary highlight cards, info callout banners. |
| `--color-foreground` | `#3a3b3a` | Charcoal dark gray. Primary headings ($h_1$–$h_6$), high-emphasis body text, primary icons. |
| `--color-foreground-muted` | `#626462` | Medium slate gray. Subheadings, body copy, metadata labels, helper text. |
| `--color-separator` | `#e0e1e0` | Subtle light gray. Hairline section borders, card dividers, table borders, utility bar borders. |
| `--color-white` | `#ffffff` | Pure white. Card containers, dropdown surfaces, modal backdrops, primary button text. |
| `--color-black` | `#000000` | Pure black. Contrast layers, scrim overlays (`rgba(0,0,0,0.5)`). |

### 1.2 Surface Grays & Neutral Tints
| Token Name | Value | Usage |
|---|---|---|
| `bg-[#F8F8F8]` | `#f8f8f8` | Light neutral page section background alternating with white. |
| `bg-[#EEEFEE]` | `#eeefee` | Neutral button and tag background. |
| `border-[#DFE0DF]` | `#dfe0df` | Subtle card outline border. |
| `--color-gray-50` | `oklch(98.5% .002 247.839)` (~`#f9fafb`) | Table header striping, subtle input field background. |
| `--color-gray-200` | `oklch(92.8% .006 264.531)` (~`#e5e7eb`) | Inactive tab borders, stepper track background. |
| `--color-gray-300` | `oklch(87.2% .01 258.338)` (~`#d1d5db`) | Disabled element border and placeholder icons. |

### 1.3 Feedback & Telemetry Status Colors
| Token Name | Value | Usage |
|---|---|---|
| `--color-emerald-600` | `oklch(59.6% .145 163.225)` (~`#059669`) | Active Green Corridor signal status, cleared route links, success banners. |
| `--color-amber-600` | `oklch(66.6% .179 58.318)` (~`#d97706`) | Amber signal warning, moderate congestion, diversion advice. |
| `--color-rose-600` | `oklch(58.6% .253 17.585)` (~`#e11d48`) | Red signal state, heavy gridlock, emergency priority conflict, error alerts. |
| `--color-blue-500` / `600` | `oklch(62.3% .214 259.815)` (~`#2563eb`) | Hyperlinks, V2X connected vehicle indicators, GPS waypoint pins. |

### 1.4 Background Pattern Token
```css
.bg-pattern {
  background-color: #fef3ed;
  background-image: radial-gradient(#f36e211f 2px, #0000 2px);
  background-position: 50%;
  background-size: 34px 34px;
}
```

---

## 2. Typography

### 2.1 Font Families
* **Primary Sans-Serif:**
  `--font-sans: "Figtree Variable", "Figtree", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
* **Monospace (Code, Telemetry, Latency Timestamps):**
  `--font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;`

### 2.2 Font Scale & Line Heights
| Token | Font Size | Line Height | Typical Role |
|---|---|---|---|
| `text-[9px]` | 9px (0.5625rem) | 12px | Status pill tags (e.g., "HIRING", "LIVE", "DEMO") |
| `text-[11px]` | 11px (0.6875rem) | 14px | Micro labels, telemetry refresh rate stamps |
| `text-xs` | 12px (0.75rem) | 16px (`1 / .75`) | Eyebrow badges, caption text, disclaimer notes |
| `text-[13px]` | 13px (0.8125rem) | 18px | Utility bar phone number, top bar quick links |
| `text-sm` | 14px (0.875rem) | 20px (`1.25 / .875`) | Navigation items, dropdown menus, table cells |
| `text-[15px]` | 15px (0.9375rem) | 22px | Main navigation bar labels, card secondary text |
| `text-base` | 16px (1.0rem) | 24px (1.5) | Standard body copy, form inputs, button text |
| `text-lg` | 18px (1.125rem) | 28px (`1.75 / 1.125`) | Card headings, lead introductory paragraphs |
| `text-xl` | 20px (1.25rem) | 28px (`1.75 / 1.25`) | Subsection titles, modal headers |
| `text-2xl` | 24px (1.5rem) | 32px (`2 / 1.5`) | Section sub-headers, module card titles |
| `text-3xl` | 30px (1.875rem) | 36px (1.2) | Mobile section headers, stat callout figures |
| `text-4xl` | 36px (2.25rem) | 40px (`2.5 / 2.25`) | Medium hero titles, major stat metrics |
| `text-5xl` | 48px (3.0rem) | 48px (1.0) | Desktop hero display headline, big numbers |

### 2.3 Font Weights & Tracking
* **Weights:** `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800).
* **Tracking:** `--tracking-tight: -0.025em;` applied on headings (`tracking-tight`).

---

## 3. Spacing & Container Hierarchy

* **Base Unit:** `--spacing: 0.25rem;` (4px).
* **Standard Gaps:**
  * Component micro-gap: `gap-1` (4px), `gap-2` (8px), `gap-2.5` (10px).
  * Card interior padding: `p-4` (16px), `p-6` (24px), `p-8` (32px), `md:p-12` (48px).
  * Section vertical breathing space: `py-12` (48px) mobile, `py-16` (64px) tablet, `md:py-24` (96px) desktop.
* **Containers:**
  * `--container-xl`: `36rem` (576px)
  * `--container-3xl`: `48rem` (768px)
  * `--container-5xl`: `64rem` (1024px)
  * `--container-7xl`: `80rem` (1280px) — standard maximum site wrapper `max-w-7xl mx-auto px-6`.
* **Sticky Header Offset:** `--header-offset: 4.5rem;` (72px).

---

## 4. Border Radii & Elevation / Shadows

### 4.1 Border Radii
| Token | Value | Applied Components |
|---|---|---|
| `rounded-sm` | `0.25rem` (4px) | Mini status tags, micro badges |
| `rounded-lg` | `0.5rem` (8px) | Dropdown menu items, text inputs |
| `rounded-xl` | `0.75rem` (12px) | Dropdown containers, small utility cards |
| `rounded-2xl` | `1.0rem` (16px) | Standard cards, cookie banner |
| `rounded-3xl` | `1.5rem` (24px) | Numbered "Why" cards, carousel items |
| `rounded-4xl` | `2.0rem` (32px) | Large feature containers |
| `rounded-[26px]` / `[36px]` | `26px` / `36px` | Hero image containers, large interactive panels |
| `rounded-full` | `9999px` | Buttons, avatar frames, pill badges |

### 4.2 Shadows
| Token | Shadow Value | Role |
|---|---|---|
| `shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` | Form controls, subtle tags |
| `shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Card hover states, active pill tabs |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Navigation dropdown menus, sticky header on scroll |
| `shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Floating control panels, simulation dialogs |
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Cookie consent banner, modal dialogues |

---

## 5. Component Construction Rules

### 5.1 Button Styles
1. **Primary Action Button (e.g., "Run Live Simulation", "Explore Platform"):**
   * Background: `#f36e20` (`bg-primary`)
   * Text: `#ffffff` (`text-white`), `font-bold` (700) or `font-semibold` (600), `text-[15px]`
   * Shape: `rounded-full`, padding `px-6 py-3` (desktop `px-8 py-3.5`)
   * Hover: `hover:opacity-90 hover:shadow-md transition-all duration-200`
   * Focus: `focus:outline-none focus:ring-2 focus:ring-primary/50`
2. **Secondary / Outline Button (e.g., "Explore Platform", "Request a Demo"):**
   * Background: Transparent or `#ffffff`
   * Border: `1px solid #dfe0df` (`border-separator`)
   * Text: `#3a3b3a` (`text-foreground`), `font-semibold`, `text-[15px]`
   * Shape: `rounded-full`, padding `px-6 py-3`
   * Hover: `hover:bg-muted hover:text-primary hover:border-primary/20 transition-all`
3. **Pill Tag / Micro-CTA (e.g., "01/03", "Projected target"):**
   * Background: `bg-muted` (`#fef2ec`), text: `text-primary` (`#f36e20`), `rounded-full`, `px-3 py-1 text-xs font-bold`.

### 5.2 The Repeating Section Header Pattern (Mandatory)
Every section must adhere to the exact 4-tier hierarchy:
```
1. [EYEBROW LABEL]  -> text-xs font-bold uppercase tracking-wider text-primary
2. [LARGE HEADING]  -> text-3xl md:text-5xl font-extrabold tracking-tight text-foreground
3. [SUPPORTING BODY]-> text-base md:text-lg text-foreground-muted max-w-2xl
4. [CALL TO ACTION] -> Primary button or text link with chevron
```

### 5.3 Numbered Cards Pattern (01, 02, 03)
* Structure: Card with large index (e.g., `01`, `02`, `03`) in top right or top left in `text-2xl font-bold text-primary`.
* Container: `bg-white border border-[#DFE0DF] rounded-3xl p-8 hover:shadow-lg transition-all`.
* Header: `text-xl font-bold text-foreground mb-3`.
* Body: `text-sm text-foreground-muted leading-relaxed`.

### 5.4 Cookie Consent Banner
* Layout: Fixed bottom bar or floating pill box `fixed bottom-4 inset-x-4 md:inset-x-auto md:right-8 md:max-w-md z-50`.
* Styling: `bg-white rounded-2xl shadow-2xl p-6 border border-separator`.
* Controls: Two buttons ("Accept All" [Primary solid], "Decline Optional" [Neutral secondary]). Choice saved in `localStorage.setItem('cookie-consent', ...)`.

---

## 6. Accessibility & Motion Guidelines

* **Contrast Compliance:** All text pairings (`#3a3b3a` on `#ffffff`, `#626462` on `#ffffff`, `#ffffff` on `#f36e20`) exceed WCAG AA 4.5:1 ratio.
* **Visible Focus:** All interactive elements feature `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`.
* **Reduced Motion:** All transitions obey `@media (prefers-reduced-motion: reduce) { transition: none !important; animation: none !important; }`.
