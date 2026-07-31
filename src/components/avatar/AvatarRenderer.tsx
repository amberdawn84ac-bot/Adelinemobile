import { AvatarData } from '../../types/game'

// Sprite sheet config: each sheet is a grid of poses
// col/row are 0-indexed positions within the sheet
const SPRITE_CONFIG: Record<string, {
  sheet: string
  cols: number
  rows: number
  col: number
  row: number
}> = {
  // Young girl — 3×3 grid
  girl_young_0: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 0, row: 0 },
  girl_young_1: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 1, row: 0 },
  girl_young_2: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 2, row: 0 },
  girl_young_3: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 0, row: 1 },
  girl_young_4: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 1, row: 1 },
  girl_young_5: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 2, row: 1 },
  girl_young_6: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 0, row: 2 },
  girl_young_7: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 1, row: 2 },
  girl_young_8: { sheet: '/avatar_girl_young.png', cols: 3, rows: 3, col: 2, row: 2 },
  // Young boy — 3×4 grid (last row has 2 poses)
  boy_young_0: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 0, row: 0 },
  boy_young_1: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 1, row: 0 },
  boy_young_2: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 2, row: 0 },
  boy_young_3: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 0, row: 1 },
  boy_young_4: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 1, row: 1 },
  boy_young_5: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 2, row: 1 },
  boy_young_6: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 0, row: 2 },
  boy_young_7: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 1, row: 2 },
  boy_young_8: { sheet: '/avatar_boy_young.png', cols: 3, rows: 4, col: 2, row: 2 },
  // Older kids — 3×4 grid: rows 0-1 = girls (middle/high), rows 2-3 = boys (middle/high)
  girl_middle_0: { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 0, row: 0 },
  girl_middle_1: { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 1, row: 0 },
  girl_middle_2: { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 2, row: 0 },
  girl_high_0:   { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 0, row: 1 },
  girl_high_1:   { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 1, row: 1 },
  girl_high_2:   { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 2, row: 1 },
  boy_middle_0:  { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 0, row: 2 },
  boy_middle_1:  { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 1, row: 2 },
  boy_middle_2:  { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 2, row: 2 },
  boy_high_0:    { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 0, row: 3 },
  boy_high_1:    { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 1, row: 3 },
  boy_high_2:    { sheet: '/avatar_older_kids.png', cols: 3, rows: 4, col: 2, row: 3 },
}

interface Props {
  avatar: AvatarData
  size?: number
  className?: string
}

export default function AvatarRenderer({ avatar, size = 80, className = '' }: Props) {
  const cfg = SPRITE_CONFIG[avatar.character] ?? SPRITE_CONFIG['girl_young_4']

  // background-size: the full sheet scaled so each cell = size×size
  const bgWidth = cfg.cols * size
  const bgHeight = cfg.rows * size
  const bgX = -(cfg.col * size)
  const bgY = -(cfg.row * size)

  return (
    <div
      className={`rounded-xl overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${cfg.sheet})`,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: 'no-repeat',
        border: `3px solid ${avatar.displayColor}`,
      }}
      aria-label="Player avatar"
    />
  )
}
