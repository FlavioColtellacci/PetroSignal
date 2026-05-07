---
name: Petroleum Intelligence Terminal
colors:
  surface: '#17120e'
  surface-dim: '#17120e'
  surface-bright: '#3f3833'
  surface-container-lowest: '#120d09'
  surface-container-low: '#201b16'
  surface-container: '#241f1a'
  surface-container-high: '#2f2924'
  surface-container-highest: '#3a342f'
  on-surface: '#ece0d9'
  on-surface-variant: '#d6c3b5'
  inverse-surface: '#ece0d9'
  inverse-on-surface: '#362f2a'
  outline: '#9e8e81'
  outline-variant: '#51443a'
  surface-tint: '#fdb87b'
  primary: '#fdb87b'
  on-primary: '#4b2700'
  primary-container: '#c0844b'
  on-primary-container: '#422200'
  inverse-primary: '#86531e'
  secondary: '#cac4cd'
  on-secondary: '#322f36'
  secondary-container: '#49454d'
  on-secondary-container: '#b9b3bc'
  tertiary: '#8ed0eb'
  on-tertiary: '#003545'
  tertiary-container: '#5799b3'
  on-tertiary-container: '#002e3c'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdcc0'
  primary-fixed-dim: '#fdb87b'
  on-primary-fixed: '#2d1600'
  on-primary-fixed-variant: '#693c07'
  secondary-fixed: '#e7e0e9'
  secondary-fixed-dim: '#cac4cd'
  on-secondary-fixed: '#1d1b21'
  on-secondary-fixed-variant: '#49454d'
  tertiary-fixed: '#baeaff'
  tertiary-fixed-dim: '#8ed0eb'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#004d62'
  background: '#17120e'
  on-background: '#ece0d9'
  surface-variant: '#3a342f'
typography:
  terminal-heading:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.02em
  data-metric-lg:
    fontFamily: IBM Plex Mono
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  data-metric-sm:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  ui-label:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  body-compact:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
spacing:
  unit: 4px
  container-padding: 12px
  gutter: 1px
  stack-compact: 4px
  stack-default: 8px
---

## Brand & Style
The design system establishes a high-performance environment for petroleum commodities trading and market intelligence. The brand personality is clinical, authoritative, and mission-critical, evoking the sense of a specialized hardware terminal rather than a consumer software application.

The aesthetic follows a "Financial Industrialism" style—a hybrid of legacy Bloomberg density and modern SaaS precision. It prioritizes information throughput over whitespace. The visual language is defined by total structural rigidity: no rounded corners, no gradients, and no decorative imagery. Every pixel must serve a functional purpose in the delivery of real-time data.

## Colors
This design system utilizes a "Deep Obsidian" palette designed for long-duration monitoring. The background is near-black to minimize eye strain and maximize the contrast of data points. 

The primary accent—Amber Gold—is used sparingly for interactive highlights, active states, and primary calls to action. Status colors (Green and Red) are strictly reserved for market movement and system alerts. Surface layers use a subtle shift from the base background to a slightly lighter secondary surface to indicate hierarchy without the need for shadows.

## Typography
Typography is split into two functional roles: Navigation and Data. 

For the UI framework and labels, **Work Sans** (substituting for IBM Plex Sans as the closest available high-performance sans) provides a clean, neutral voice. For all quantitative data, prices, timestamps, and ticker symbols, **IBM Plex Mono** is mandatory. This ensures that columns of numbers align perfectly, allowing traders to scan for discrepancies instantly. All typography is set with tight line-heights to support high information density.

## Layout & Spacing
The layout uses a high-density "Grid-Lock" philosophy. Unlike modern SaaS which favors generous margins, this design system uses a 4px base unit with minimal padding. 

A 12-column fluid grid is employed, but components are separated by the subtle 1px border rather than large gutters, creating a tiled "glass-cockpit" effect. Dashboards should stretch to 100% width and height of the viewport to maximize the data visible above the fold.

## Elevation & Depth
Depth is achieved through "Tonal Stacking" rather than shadows. 
- **Level 0 (#07050a):** The master background.
- **Level 1 (#121016):** Card surfaces and secondary containers.
- **Level 2 (rgba(255,255,255,0.04)):** Hover states and active row highlights.

Borders are the primary method of separation. A consistent 1px stroke (rgba(255,255,255,0.08)) is used for all containers, inputs, and dividers. This creates a blueprint-like aesthetic that feels engineered and precise.

## Shapes
The shape language is strictly orthogonal. All containers, buttons, and input fields feature 90-degree sharp corners (0px radius). This reinforces the "Terminal" aesthetic and allows components to sit flush against one another without creating visual gaps. The only exception is the pill-style status badge, which uses a full radius to differentiate transient status indicators from structural UI elements.

## Components
- **High-Density Cards:** Sharp-edged containers with a 1px border. Headers should have a subtle bottom border and use `ui-label` typography.
- **Mono-spaced Data Tables:** The core of the system. Rows should have a height of 32px or 28px. Use alternating row stripes or 1px dividers. Numerical data must be right-aligned.
- **Pill-style Status Badges:** Compact labels with a 100px border-radius. Use high-contrast text on background colors (#22c55e for "Active", #ef4444 for "Volatility Alert").
- **Terminal Inputs:** Text fields should be dark (#07050a) with a 1px amber border on focus. No shadows or glow effects.
- **Action Buttons:** Primary buttons are solid Amber (#b87d45) with black text. Secondary buttons are outlined with white text. All are sharp-cornered.
- **Metric Tickers:** Continuous horizontally-scrolling ribbons at the top or bottom of the screen using `data-metric-sm` for live commodity pricing.