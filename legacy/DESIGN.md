# Design

## Style Summary

sedekah.je uses a restrained product UI for a public Malaysian donation directory. The system should feel calm and maintained: soft warm-neutral surfaces, a clear verified-green primary, quiet amber for local warmth, and blue only for map/location utility. The public pages should avoid decorative gradients and heavy campaign styling.

## Color

Color strategy: restrained.

Use OKLCH tokens as the source of truth in `app/globals.css`, exposed through existing shadcn-compatible CSS variables.

- Background: warm off-white, never pure white.
- Foreground: green-tinted charcoal, never pure black.
- Primary: verified-green for primary actions, active filters, focus rings, and trust indicators.
- Secondary and muted: warm stone surfaces for toolbars, filters, and quiet panels.
- Accent: soft amber for low-emphasis highlights only.
- Info/location: blue may be used sparingly for map and location actions.
- Destructive: sober red for destructive or error states.

Dark mode should remain functional but quiet: deep green-tinted surfaces, clear text contrast, and the same green primary.

## Typography

Use the existing Poppins setup for now, but reduce visual shouting. Headings should use weight for hierarchy, not oversized display treatment. Body copy should stay short and direct, with public helper text capped at readable line lengths.

## Layout

Public directory pages should prioritize search and filtering above decoration. Use a sticky, compact discovery toolbar with consistent control shapes. Institution cards should be scan-friendly and stable, with QR previews, institution names, location, and actions arranged consistently.

Spacing should vary by surface importance: tighter inside controls and cards, more breathing room between major public sections. Avoid nested cards and identical decorative card grids outside actual institution listings.

## Components

- Buttons: 8px radius by default, one visual language across public pages. Avoid one-off gradients.
- Inputs/selects: consistent border, background, height, focus ring, and shadow behavior.
- Filter chips: active state uses primary-green with readable foreground; count badges stay subdued.
- Cards: calm border, subtle shadow, stable QR area, clear hover/focus state.
- Header: should frame the app as a utility, not a hero. Brand and nav remain compact.
- Empty/loading states: short Bahasa Malaysia copy, skeletons where content will appear.

## Motion

Motion should communicate state only. Keep transitions around 150-250ms, use ease-out timing, and avoid decorative choreography. Respect reduced-motion preferences where practical.

## Public Page Intent

Physical scene: a person in Malaysia opens the app on a phone after hearing a mosque name or scanning through donation options, likely in bright ambient light, wanting to verify and act quickly without reading a sales pitch.

This points to a light, calm default theme with high legibility, compact discovery tools, and modest trust cues.
