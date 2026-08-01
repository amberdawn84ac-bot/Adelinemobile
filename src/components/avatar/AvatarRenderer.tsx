import { AvatarData } from '../../types/game'

// Actual pixel dimensions of each sprite sheet
const SHEET_DIMS: Record<string, { w: number; h: number; cols: number; rows: number }> = {
  '/avatar_girl_young.png':  { w: 1402, h: 1122, cols: 3, rows: 3 },
  '/avatar_boy_young.png':   { w: 1536, h: 1024, cols: 4, rows: 3 },
  '/avatar_older_kids.png':  { w: 1536, h: 1024, cols: 3, rows: 4 },
}

// Each entry: which sheet, and which grid cell (col/row, 0-indexed)
const SPRITE_CONFIG: Record<string, { sheet: string; col: number; row: number }> = {
  // Young girl — 3 cols × 3 rows
  girl_young_0: { sheet: '/avatar_girl_young.png', col: 0, row: 0 },
  girl_young_1: { sheet: '/avatar_girl_young.png', col: 1, row: 0 },
  girl_young_2: { sheet: '/avatar_girl_young.png', col: 2, row: 0 },
  girl_young_3: { sheet: '/avatar_girl_young.png', col: 0, row: 1 },
  girl_young_4: { sheet: '/avatar_girl_young.png', col: 1, row: 1 },
  girl_young_5: { sheet: '/avatar_girl_young.png', col: 2, row: 1 },
  girl_young_6: { sheet: '/avatar_girl_young.png', col: 0, row: 2 },
  girl_young_7: { sheet: '/avatar_girl_young.png', col: 1, row: 2 },
  girl_young_8: { sheet: '/avatar_girl_young.png', col: 2, row: 2 },
  // Young boy — 4 cols × 3 rows (actual sheet is landscape 1536×1024)
  boy_young_0: { sheet: '/avatar_boy_young.png', col: 0, row: 0 },
  boy_young_1: { sheet: '/avatar_boy_young.png', col: 1, row: 0 },
  boy_young_2: { sheet: '/avatar_boy_young.png', col: 2, row: 0 },
  boy_young_3: { sheet: '/avatar_boy_young.png', col: 3, row: 0 },
  boy_young_4: { sheet: '/avatar_boy_young.png', col: 0, row: 1 },
  boy_young_5: { sheet: '/avatar_boy_young.png', col: 1, row: 1 },
  boy_young_6: { sheet: '/avatar_boy_young.png', col: 2, row: 1 },
  boy_young_7: { sheet: '/avatar_boy_young.png', col: 3, row: 1 },
  boy_young_8: { sheet: '/avatar_boy_young.png', col: 0, row: 2 },
  // Older kids — 3 cols × 4 rows: rows 0-1 = girls (middle/high), rows 2-3 = boys
  girl_middle_0: { sheet: '/avatar_older_kids.png', col: 0, row: 0 },
  girl_middle_1: { sheet: '/avatar_older_kids.png', col: 1, row: 0 },
  girl_middle_2: { sheet: '/avatar_older_kids.png', col: 2, row: 0 },
  girl_high_0:   { sheet: '/avatar_older_kids.png', col: 0, row: 1 },
  girl_high_1:   { sheet: '/avatar_older_kids.png', col: 1, row: 1 },
  girl_high_2:   { sheet: '/avatar_older_kids.png', col: 2, row: 1 },
  boy_middle_0:  { sheet: '/avatar_older_kids.png', col: 0, row: 2 },
  boy_middle_1:  { sheet: '/avatar_older_kids.png', col: 1, row: 2 },
  boy_middle_2:  { sheet: '/avatar_older_kids.png', col: 2, row: 2 },
  boy_high_0:    { sheet: '/avatar_older_kids.png', col: 0, row: 3 },
  boy_high_1:    { sheet: '/avatar_older_kids.png', col: 1, row: 3 },
  boy_high_2:    { sheet: '/avatar_older_kids.png', col: 2, row: 3 },
}

interface Props {
  avatar: AvatarData
  size?: number       // display size in px (both width and height — crops to square)
  className?: string
}

export default function AvatarRenderer({ avatar, size = 80, className = '' }: Props) {
  const cfg = SPRITE_CONFIG[avatar.character] ?? SPRITE_CONFIG['girl_young_4']
  const dims = SHEET_DIMS[cfg.sheet]

  // Each cell's natural pixel size
  const cellW = dims.w / dims.cols
  const cellH = dims.h / dims.rows

  // Scale factor so the cell fits within `size` (preserving aspect, fitting the taller dimension)
  const scale = size / Math.max(cellW, cellH)

  const bgW = Math.round(dims.w * scale)
  const bgH = Math.round(dims.h * scale)
  const bgX = -Math.round(cfg.col * cellW * scale)
  const bgY = -Math.round(cfg.row * cellH * scale)

  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${cfg.sheet})`,
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        outline: `3px solid ${avatar.displayColor}`,
        outlineOffset: '-3px',
        borderRadius: '12px',
      }}
      aria-label="Player avatar"
    />
  )
}
