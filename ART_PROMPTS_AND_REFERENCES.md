# No Vacancies - Image Prompt Pack + References

Date: 2026-02-04  
Scope: Core in-game image set + recommended expansion set

## Non-Negotiable Visual Rules

1. Never show Oswaldo's face or bare skin in any image.
2. Sydney must be consistent: 44, brunette, asymmetric bob haircut, blue eyes, pretty.
3. Work/setup scenes must show Sydney with 3-5 smartphones in her hands/lap, each phone with a pop socket.
4. Do not depict a laptop in any new/updated Sydney work image.
5. Tone: cinematic realism, motel grit, grounded lighting, no glam fantasy styling.

## Story Context (for image models with zero project knowledge)

Use this context block in your image generation session before running individual prompts:

`No Vacancies is an emotionally intense interactive story set in a low-budget daily-rate motel at dawn. Sydney is the central character: 44, brunette, asymmetric bob, blue eyes, attractive, exhausted but competent. She is under financial pressure and works from a multi-phone setup (3-5 smartphones with pop sockets). Visual tone is intimate, tense, realistic, and grounded in cluttered motel interiors with mixed warm practical light and cool neon spill.`

## Character Continuity Lock (always include)

`Sydney continuity lock: female, 44 years old, brunette hair, asymmetric bob haircut, blue eyes, pretty, realistic proportions, consistent face identity across all frames.`

## Reference Workflow (important)

For each image prompt:

1. Use the listed **Reference** image(s) as image-to-image guidance (or style/character reference slots).
2. Keep reference strength medium-high so Sydney remains consistent.
3. Combine: **Style Prefix + Character Continuity Lock + Prompt + Negative Prompt**.
4. If your tool supports seed locking, keep one Sydney seed for all Sydney-centered images.

Recommended reference strength targets (tool-agnostic):

- Character reference: 60-80%
- Style reference: 30-50%
- Composition reference: 30-60%

## Reusable Style Prefix

Use this at the start of each prompt:

`Cinematic realist still frame, 35mm look, intimate motel drama, subtle film grain, practical lighting, muted neon spill, emotionally tense but grounded, highly detailed textures, natural skin tones, no text overlay, no watermark`

## Reusable Negative Prompt

Use this at the end of each prompt:

`no laptop, no fantasy styling, no anime, no extra fingers, no deformed hands, no duplicate faces, no smiling stock-photo look, no clean luxury hotel aesthetic, no Oswaldo face, no exposed male skin`

## Copy/Paste Prompt Assembly Template

`[STYLE PREFIX]. [CHARACTER CONTINUITY LOCK]. [SCENE PROMPT]. [NEGATIVE PROMPT].`

Example:
`Cinematic realist still frame... Sydney continuity lock... Sydney intensely multitasking 5 smartphones with pop sockets... no laptop, no anime...`

---

## Core Required Image Set (Mapped to Current `ImageKeys`)

### 1) `hotel_room` -> `images/hotel_room.png`

Prompt:
`Dawn inside a cramped daily-rate motel room, Sydney (44, brunette asymmetric bob, blue eyes) sitting on edge of bed with 4 phones with pop sockets spread across lap and hands, dim yellow lamp plus blue street neon leaking through blinds, rumpled blankets, cluttered side table, unpaid-rent tension in posture`

References:

- `images/hotel_room.png` (primary composition/style)
- `images/sydney_thinking.png` (secondary face continuity)

### 2) `sydney_laptop` (repurpose to multi-phone setup) -> `images/sydney_laptop.png`

Prompt:
`Sydney (44, brunette asymmetric bob, blue eyes, pretty) intensely multitasking 5 phones with pop sockets, thumbs moving, notification glow on face, motel room background out of focus, exhausted concentration, no computer visible`

References:

- `images/sydney_laptop.png` (primary framing replacement target)
- `images/sydney_phone_anxious.png` (secondary phone-hand continuity)

### 3) `sydney_thinking` -> `images/sydney_thinking.png`

Prompt:
`Close three-quarter portrait of Sydney (44, brunette asymmetric bob, blue eyes), quiet calculating expression, 3 phones with pop sockets resting in lap, early morning motel light, emotional fatigue and strategic focus`

References:

- `images/sydney_thinking.png` (primary character continuity)
- `images/sydney_window_dawn.png` (secondary dawn lighting)

### 4) `sydney_frustrated` -> `images/sydney_frustrated.png`

Prompt:
`Sydney (44, brunette asymmetric bob, blue eyes) visibly frustrated, one hand on forehead, 3 phones with pop sockets in other hand and on blanket, tense jaw, motel room clutter, harsh practical lighting`

References:

- `images/sydney_frustrated.png` (primary expression)
- `images/sydney_tired.png` (secondary mood continuity)

### 5) `sydney_tired` -> `images/sydney_tired.png`

Prompt:
`Sydney (44, brunette asymmetric bob, blue eyes) burned out, slumped posture, under-eye fatigue, 4 phones with pop sockets loosely held, half-drunk coffee cup nearby, dawn light through blinds`

References:

- `images/sydney_tired.png` (primary fatigue expression)
- `images/sydney_coffee_morning.png` (secondary prop/lighting continuity)

### 6) `sydney_phone` -> `images/sydney_phone_anxious.png`

Prompt:
`Anxious close-up of Sydney (44, brunette asymmetric bob, blue eyes) with two phones in hands and two in lap, all with pop sockets, incoming alerts reflected in eyes, motel background soft blur`

References:

- `images/sydney_phone_anxious.png` (primary composition)
- `images/sydney_laptop.png` (secondary multi-phone continuity)

### 7) `sydney_coffee` -> `images/sydney_coffee_morning.png`

Prompt:
`Sydney (44, brunette asymmetric bob, blue eyes) at motel morning table with coffee and 3 phones with pop sockets, first-light ambience, tired but determined expression, lived-in clutter, realistic textures`

References:

- `images/sydney_coffee_morning.png` (primary morning coffee composition)
- `images/sydney_window_dawn.png` (secondary dawn light tone)

### 8) `sydney_window` -> `images/sydney_window_dawn.png`

Prompt:
`Sydney (44, brunette asymmetric bob, blue eyes) by motel window at dawn, holding 3 phones with pop sockets against chest, reflective mood, cool blue exterior light mixed with warm interior lamp`

References:

- `images/sydney_window_dawn.png` (primary composition)
- `images/sydney_thinking.png` (secondary face continuity)

### 9) `oswaldo_sleeping` -> `images/oswaldo_sleeping.png`

Prompt:
`Motel bed with Oswaldo sleeping fully covered by blanket and hoodie, face hidden and skin not visible, camera angle from foot of bed, Sydney blurred in foreground with 3 phones with pop sockets, heavy morning tension`

References:

- `images/oswaldo_sleeping.png` (primary scene blocking)
- `images/sydney_tired.png` (secondary Sydney continuity in foreground)

### 10) `oswaldo_awake` -> `images/oswaldo_awake.png`

Prompt:
`Oswaldo implied presence only: back turned, hood up, hands/gloves covered, no face visible, no bare skin, Sydney in foreground with 3-4 phones with pop sockets, confrontational motel room atmosphere`

References:

- `images/oswaldo_awake.png` (primary blocking; regenerate with strict no-face framing)
- `images/sydney_oswaldo_tension.png` (secondary tension composition)

### 11) `the_door` -> `images/the_door.png`

Prompt:
`Motel room door framed as emotional threshold, chain latch visible, harsh hallway light under door, Sydney's hand holding a phone with pop socket near the knob, suspenseful composition`

References:

- `images/the_door.png` (primary doorway composition)
- `images/hotel_room.png` (secondary environmental continuity)

### 12) `empty_room` -> `images/empty_room.png`

Prompt:
`Empty motel room after conflict, bed unmade, scattered receipts and charger cords, 2 phones with pop sockets left on blanket, cool desaturated light, sense of aftermath`

References:

- `images/empty_room.png` (primary composition)
- `images/hotel_room.png` (secondary room identity continuity)

### 13) `motel_exterior` -> `images/motel_exterior.png`

Prompt:
`Exterior of low-budget motel at dawn, flickering vacancy sign, Sydney silhouette near railing holding phones with pop sockets, mood of uncertainty and transition, cinematic realism`

References:

- `images/motel_exterior.png` (primary exterior continuity)
- `images/sydney_window_dawn.png` (secondary dawn palette continuity)

---

## Recommended Expansion Set (8 Additional Assets)

These fill narrative gaps and reduce repeated visuals.

### A) `trina_crashed` -> `images/trina_crashed.png` (existing file, not currently mapped)

Prompt:
`Trina asleep on floor under blanket, face partially hidden by hoodie sleeve/hair, clutter around her, Sydney in background with phones and coffee, cramped motel tension`

References:

- `images/trina_crashed.png` (primary)
- `images/hotel_room.png` (secondary environment continuity)

### B) `sydney_oswaldo_tension` -> `images/sydney_oswaldo_tension.png` (existing file, not currently mapped)

Prompt:
`Sydney foreground with 3 phones in hand, Oswaldo background as back-turned silhouette only (no face/skin), room split by light/shadow to convey conflict`

References:

- `images/sydney_oswaldo_tension.png` (primary)
- `images/sydney_frustrated.png` (secondary Sydney expression)

### C) `convenience_store` -> `images/convenience_store.png` (existing file, not currently mapped)

Prompt:
`Fluorescent convenience store aisle, Sydney holding 3 phones with pop sockets and counting bills/coins, exhausted but focused, late-night/early-morning vibe`

References:

- `images/convenience_store.png` (primary)
- `images/sydney_phone_anxious.png` (secondary hand/phone continuity)

### D) `car_memory` -> `images/car_memory.png` (existing file, not currently mapped)

Prompt:
`Memory/flashback tone: damaged car at night, red-blue emergency reflections, Sydney seen in profile clutching phone, emotionally distant composition`

References:

- `images/car_memory.png` (primary)
- `images/sydney_window_dawn.png` (secondary emotional tone)

### E) `front_desk_knock` -> new file recommended: `images/front_desk_knock.png`

Prompt:
`Motel clerk shadow at doorway with payment clipboard, Sydney inside room gripping 3 phones with pop sockets, urgent rent-deadline pressure, tight framing`

### F) `bathroom_mirror_breakdown` -> new file recommended: `images/bathroom_mirror_breakdown.png`

Prompt:
`Sydney in motel bathroom mirror, blue eyes tired, asymmetric bob slightly disheveled, 3 phones with pop sockets on sink edge, harsh fluorescent lighting, emotional breaking point`

### G) `hallway_ice_machine` -> new file recommended: `images/hallway_ice_machine.png`

Prompt:
`Motel hallway with humming ice machine, cold overhead lighting, Sydney leaning against wall with phone stack in lap, moment of private regrouping`

### H) `cash_counting_hands` -> new file recommended: `images/cash_counting_hands.png`

Prompt:
`Close-up of Sydney's hands counting crumpled bills beside 3 phones with pop sockets, motel bedspread texture, shallow depth of field, economic stress made tangible`

---

## Quick Mapping Notes

- Keep existing `ImageKeys` names for compatibility; update image content to match this guide.
- `sydney_laptop` key is now a semantic alias for "Sydney multi-phone setup work mode."
- Regenerate `oswaldo_sleeping` and `oswaldo_awake` first to enforce no face/skin rule.
- If a generator keeps exposing Oswaldo's face, crop tighter, switch to over-shoulder framing, or replace with `sydney_oswaldo_tension` composition.

---

## Optional PDF Export

If you have Pandoc + a PDF engine installed locally, run:

`pandoc ART_PROMPTS_AND_REFERENCES.md -o ART_PROMPTS_AND_REFERENCES.pdf`
