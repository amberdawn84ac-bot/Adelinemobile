# Avatar Picker Redesign — Design Spec
**Date:** 2026-08-05
**Status:** Draft (pending user review)

---

## Context

Adelinemobile's avatar system renders a small square badge (36–100px) everywhere it's shown — the avatar builder preview, `GameHUD`, `HubWorld`, and `MiniWorld` — never a large full-body character. It currently sources that badge by CSS-cropping a cell out of one of three "sprite sheet" PNGs (`avatar_girl_young.png`, `avatar_boy_young.png`, `avatar_older_kids.png`) using a hardcoded `cols`/`rows` grid in `AvatarRenderer.tsx`.

**Root cause of the reported bug ("avatars are cut out"):** those sheets are AI-generated collages, not uniform grids. Verified by rendering grid overlays at the assumed dimensions:
- `avatar_girl_young.png` (1402×1122): code assumes 3 cols × 3 rows (9 cells); the sheet is actually 4 cols × 2 rows (8 poses). Every grid line in the wrong 3×3 config slices through a character's face or hands.
- `avatar_boy_young.png` (1536×1024): code assumes 4 cols × 3 rows (12 cells). The real layout has **5 poses in row 1 and 6 poses in row 2** — not even internally consistent, so no single `cols`/`rows` value can ever crop it correctly.

No grid-math fix can repair these source assets. They need to be replaced.

## Decision

Replace the full-body sprite-sheet system with a **16-portrait picker**, sourced from a reference image the user supplied (`avatars.png`) — a genuinely uniform 4×4 grid (1254×1254px, so each cell is exactly 313.5×313.5px) of warm, painterly headshot portraits of diverse kids in nature/cottage settings. This is a character-*select* model (pick one of 16 faces), matching how the avatar is actually used everywhere (a small square badge) — not a single character shown in different poses.

This spec covers **only** the avatar system. The wider app-wide visual reskin (color palette, backgrounds, Adeline NPC art, mason-jar UI chrome) is out of scope — noted for a future spec.

## Asset Pipeline

Pre-crop `avatars.png` into 16 separate static PNG files at `public/avatars/portrait-01.png` through `portrait-16.png`, numbered left-to-right, top-to-bottom (row-major). This is a one-time prep step, done once, checked into the repo — not a runtime slicing operation.

**Why pre-crop instead of keeping one sheet + runtime `background-position` math:** it permanently eliminates the bug class that caused this issue in the first place. Sixteen small static files are simpler to reason about than grid math, and there's no future sheet swap that can silently break cropping again.

Crop rectangles (0-indexed row/col, source is 1254×1254):
```
cell(col, row) = image.crop(
  round(col * 313.5), round(row * 313.5),
  round((col + 1) * 313.5), round((row + 1) * 313.5)
)
```
16 cells total, `portrait-01` = (col 0, row 0) through `portrait-16` = (col 3, row 3), row-major order.

## Type Changes

`src/types/game.ts`:
- `AvatarCharacter` becomes a union of 16 string literals: `'portrait_01' | 'portrait_02' | ... | 'portrait_16'`. (Old sprite-name literals like `'girl_young_0'` are removed.)
- `AvatarData` shape is unchanged (`{ character: AvatarCharacter, displayColor: string }`).
- `DEFAULT_AVATAR.character` changes from `'girl_young_4'` to `'portrait_01'`.

## Component Changes

**`src/components/avatar/AvatarRenderer.tsx`** — simplified entirely. Replace `SHEET_DIMS`/`SPRITE_CONFIG`/grid-math with a flat lookup:
```ts
const PORTRAIT_PATHS: Record<AvatarCharacter, string> = {
  portrait_01: '/avatars/portrait-01.png',
  // ... through portrait_16
}
```
Render as `<img src={PORTRAIT_PATHS[avatar.character] ?? PORTRAIT_PATHS.portrait_01} className="w-full h-full object-cover" />` inside the existing square, rounded, colored-outline-ring wrapper div (that wrapper's styling is unchanged — only the image-cropping mechanism changes). The `?? PORTRAIT_PATHS.portrait_01` fallback handles any avatar record saved with an old sprite-name character ID, so a stale saved avatar renders portrait 1 instead of a broken image.

**`src/components/avatar/AvatarBuilder.tsx`** — remove the category-tabs UI (`Category` type, `CATEGORIES`, `CATEGORY_CHARACTERS`, `getCategoryForCharacter`) entirely, since the new art isn't organized by age/gender. Replace the category-tabbed character grid with one flat `grid-cols-4` grid of all 16 portraits (matches the 4×4 source layout). The accent-color ring picker section is unchanged.

## Data Migration

No database/backend migration needed — `avatar_data` is stored as opaque JSON (`Record<string, unknown>`) on both the brain (`avatarData` jsonb column) and previously Supabase; the app never validates the stored `character` value server-side. The fallback in `AvatarRenderer` (above) is sufficient: a kid with an old sprite-name avatar sees portrait 1 on next load instead of a broken image, and can immediately pick a new one via the builder if they want.

## Testing / Verification

No test runner exists in this project (consistent with the rest of the codebase — verification elsewhere in this project has been `tsc --noEmit` + manual checks). Verification for this change:
1. `npx tsc --noEmit` — confirms the type changes don't break any consumer.
2. Visual check of all 16 pre-cropped portrait files (render them in a grid) to confirm clean crops with no bleed, before committing the asset files — the same technique already used above to diagnose the bug.
3. Manual check of the avatar builder UI and at least one in-world HUD/hub render, once a browser-capable session is available (not possible in the current environment — flagged the same way the auth-rewrite plan's Task 7 was).
