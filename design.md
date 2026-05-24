---
version: alpha
name: No Vacancies
description: A motel-noir design system for an interactive narrative game about invisible labor
colors:
  primary: "#FF6B35"
  secondary: "#004E89"
  accent-neon: "#FFFF00"
  accent-danger: "#FF0000"
  accent-success: "#00FF00"
  bg-black: "#0D0A0B"
  bg-dark: "#151112"
  bg-darker: "#0C0A0B"
  motel-sign: "#FF1744"
  chrome-silver: "#D3D3D3"
  text-primary: "#F7F1E8"
  text-secondary: "#B8AA9D"
typography:
  h1:
    fontFamily: Courier, monospace
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: 0.05em
  h2:
    fontFamily: Courier, monospace
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.03em
  h3:
    fontFamily: Courier, monospace
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Georgia, serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  body-md:
    fontFamily: Georgia, serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Courier, monospace
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0.1em
rounded:
  sm: 2px
  md: 4px
  lg: 6px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
components:
  button-primary:
    backgroundColor: "{colors.motel-sign}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-choice:
    backgroundColor: "transparent"
    borderColor: "{colors.accent-neon}"
    textColor: "{colors.accent-neon}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  card:
    backgroundColor: "rgba(24, 18, 20, 0.8)"
    borderColor: "rgba(247, 241, 232, 0.12)"
    rounded: "{rounded.md}"
    padding: "24px"
  input:
    backgroundColor: "rgba(9, 7, 7, 0.8)"
    borderColor: "rgba(247, 241, 232, 0.22)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
---

## Overview

No Vacancies is a motel-noir interactive narrative game about invisible labor, relationship load-bearing, and the cost of always being "on." The design evokes a budget motel at 2 AM—harsh fluorescent lights, neon signs, worn furnishings, and the weight of lonely decisions. It's intimate, uncomfortable, and unflinching.

The target audience is adults processing complex relationship dynamics, particularly around emotional labor and self-sacrifice. The emotional response should be: unsettled, seen, introspective, and strangely intimate.

## Colors

A deliberately limited, dystopian palette. Motel signage red, faded cream, and deep blacks create visual discomfort balanced with accessibility.

- **Primary (#FF6B35):** Burnt orange—practical, industrial, slightly depressing. Used for secondary UI and atmospheric accents.
- **Secondary (#004E89):** Deep navy for grounding elements and structure.
- **Accent Neon (#FFFF00):** Harsh yellow-green neon for critical UI elements and choice markers. Mimics motel signage and creates visual tension.
- **Accent Danger (#FF0000):** Bright red—rare, used only for critical story moments or game-over states.
- **Accent Success (#00FF00):** Bright green—used ironically or for puzzle solutions; slightly unsettling in context.
- **BG Black (#0D0A0B):** Jet black, like a motel room with lights off.
- **BG Dark (#151112):** Slightly lighter for cards and nested elements, creating minimal depth.
- **BG Darker (#0C0A0B):** For alternating sections and focus elements.
- **Motel Sign (#FF1744):** Vivid neon red—dominant motel aesthetic. Reserved for critical actions.
- **Chrome Silver (#D3D3D3):** Metallic gray for UI chrome and "equipment" feel.
- **Text Primary (#F7F1E8):** Warm off-white for readable long-form text and narrative.
- **Text Secondary (#B8AA9D):** Muted taupe for secondary text and hints.

## Typography

Monospace for UI chrome and decision trees (evoking computer terminals and motel signs); serif for narrative prose (intimate, literary). The contrast mirrors the game's duality: mechanical systems vs. human emotion.

- **Headlines & UI**: Courier monospace, bold, with tracking. Feels harsh, technical, authentic.
- **Story Prose**: Georgia serif for warmth and emotional resonance.
- **Labels & Commands**: Monospace, all-caps, tightly tracked. Operational, not friendly.

## Layout

Prose-first layout: narrative text dominates the center; UI chrome (choice buttons, status chips, utilities) clusters at edges or below. Single-column mobile; wider on desktop with margin-based UI placement. Generous line-length for prose (50–70 characters); compact for UI.

## Elevation & Depth

Minimal shadows; depth through transparency and color layering. Cards use dark transparent backgrounds (rgba(24,18,20,0.8)) with thin light borders. The effect is motel-room fluorescent: flatness with thin definition.

## Shapes

Minimal rounding (2px on buttons, 4px on cards). Sharp edges feel institutional and uncomfortable—reinforcing the motel aesthetic.

## Components

### Buttons
- **Primary Action (Red)**: Vivid neon red background, black text, 2px rounding. Used for game-critical actions ("Confront," "Leave," "Stay").
- **Secondary Action (Navy)**: Deep navy background, cream text, 2px rounding.
- **Choice Button (Neon Yellow)**: Transparent with neon yellow border and text. Used for story choices—mimics motel signage and makes decisions visible and uncomfortable.

### Cards
- Dark transparent background (rgba(24,18,20,0.8)), 24px padding, 4px rounding, thin light border (12% opacity).
- Used for scene descriptions, metadata, and system status.

### Inputs & Story Prose Blocks
- Very dark background (rgba(9,7,7,0.8)), light border (22% opacity), 4px rounding, 12px 16px padding.
- Text in warm cream for readability on dark.

### Status Chips (Specialized)
- Small rounded badges for mood, arc progress, relationship status. Uses motel red, neon yellow, or navy background with contrasting text.

### Choice Deck (Specialized Component)
- Three choice buttons stacked vertically or horizontally, neon borders, monospace labels.
- Numbers (1, 2, 3) adjacent for keyboard shortcuts.
- Each choice feels significant and permanent.

### Therapist's Notes / Dr. Ember Blocks
- Slightly elevated visual treatment: thin border in chrome silver, internal padding, serif body text.
- Positioned to the side on desktop, inline on mobile.
- Creates a "clinical observation interrupting narrative" moment.

## Do's and Don'ts

- **Do** use neon yellow sparingly for moments of choice and tension—it should feel uncomfortable.
- **Don't** use bright colors for pleasant or celebratory moments; the palette is dystopian by design.
- **Do** make every choice visually weighty. The motel-noir aesthetic means decisions feel consequential.
- **Don't** add decorative flourishes or soft animations; harshness is thematic.
- **Do** balance prose (serif, warm, literary) with UI (monospace, chrome, cold). The tension is intentional.
- **Don't** hide complexity; the interface should feel like you're interfacing with a system, not playing a game.
- **Do** use darkness as intimacy: the motel room is small, private, inescapable.
- **Don't** use high-contrast white; cream text reduces eye strain during emotional scenes.