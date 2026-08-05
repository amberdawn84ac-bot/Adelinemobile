import { AvatarCharacter, AvatarData } from '../../types/game'

const PORTRAIT_PATHS: Record<AvatarCharacter, string> = {
  portrait_01: '/avatars/portrait-01.png',
  portrait_02: '/avatars/portrait-02.png',
  portrait_03: '/avatars/portrait-03.png',
  portrait_04: '/avatars/portrait-04.png',
  portrait_05: '/avatars/portrait-05.png',
  portrait_06: '/avatars/portrait-06.png',
  portrait_07: '/avatars/portrait-07.png',
  portrait_08: '/avatars/portrait-08.png',
  portrait_09: '/avatars/portrait-09.png',
  portrait_10: '/avatars/portrait-10.png',
  portrait_11: '/avatars/portrait-11.png',
  portrait_12: '/avatars/portrait-12.png',
  portrait_13: '/avatars/portrait-13.png',
  portrait_14: '/avatars/portrait-14.png',
  portrait_15: '/avatars/portrait-15.png',
  portrait_16: '/avatars/portrait-16.png',
}

export const ALL_PORTRAITS = Object.keys(PORTRAIT_PATHS) as AvatarCharacter[]

interface Props {
  avatar: AvatarData
  size?: number       // display size in px (both width and height — crops to square)
  className?: string
}

export default function AvatarRenderer({ avatar, size = 80, className = '' }: Props) {
  const src = PORTRAIT_PATHS[avatar.character] ?? PORTRAIT_PATHS.portrait_01

  return (
    <div
      className={`overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        outline: `3px solid ${avatar.displayColor}`,
        outlineOffset: '-3px',
        borderRadius: '12px',
      }}
    >
      <img src={src} alt="Player avatar" className="w-full h-full object-cover" />
    </div>
  )
}
