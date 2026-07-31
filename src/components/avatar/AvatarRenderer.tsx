import { AvatarData } from '../../types/game'
import { getOutfit } from './avatarLayers'

interface Props {
  avatar: AvatarData
  size?: number
  className?: string
}

function HairShape({ style, color }: { style: AvatarData['hairStyle']; color: string }) {
  switch (style) {
    case 'short':
      return <ellipse cx="50" cy="32" rx="26" ry="18" fill={color} />
    case 'long':
      return (
        <g fill={color}>
          <ellipse cx="50" cy="30" rx="26" ry="18" />
          <rect x="24" y="38" width="8" height="45" rx="4" />
          <rect x="68" y="38" width="8" height="45" rx="4" />
        </g>
      )
    case 'curly':
      return (
        <g fill={color}>
          <ellipse cx="50" cy="28" rx="30" ry="22" />
          <ellipse cx="22" cy="42" rx="10" ry="12" />
          <ellipse cx="78" cy="42" rx="10" ry="12" />
        </g>
      )
    case 'braids':
      return (
        <g fill={color}>
          <ellipse cx="50" cy="30" rx="26" ry="18" />
          <rect x="26" y="44" width="7" height="50" rx="3" />
          <rect x="67" y="44" width="7" height="50" rx="3" />
          <ellipse cx="29" cy="96" rx="5" ry="4" />
          <ellipse cx="71" cy="96" rx="5" ry="4" />
        </g>
      )
    case 'ponytail':
      return (
        <g fill={color}>
          <ellipse cx="50" cy="30" rx="26" ry="18" />
          <ellipse cx="74" cy="28" rx="8" ry="6" />
          <rect x="72" y="28" width="6" height="30" rx="3" />
          <ellipse cx="75" cy="60" rx="6" ry="5" />
        </g>
      )
  }
}

function EyeShape({ style }: { style: AvatarData['eyeStyle'] }) {
  switch (style) {
    case 'round':
      return (
        <g fill="#1a1a2e">
          <circle cx="38" cy="55" r="5" />
          <circle cx="62" cy="55" r="5" />
          <circle cx="40" cy="53" r="1.5" fill="white" />
          <circle cx="64" cy="53" r="1.5" fill="white" />
        </g>
      )
    case 'almond':
      return (
        <g fill="#1a1a2e">
          <ellipse cx="38" cy="55" rx="6" ry="4" />
          <ellipse cx="62" cy="55" rx="6" ry="4" />
          <circle cx="40" cy="54" r="1.5" fill="white" />
          <circle cx="64" cy="54" r="1.5" fill="white" />
        </g>
      )
    case 'wide':
      return (
        <g fill="#1a1a2e">
          <circle cx="38" cy="55" r="6.5" />
          <circle cx="62" cy="55" r="6.5" />
          <circle cx="40" cy="52" r="2" fill="white" />
          <circle cx="64" cy="52" r="2" fill="white" />
        </g>
      )
  }
}

function AccessoryShape({ id, hairColor }: { id: AvatarData['accessoryId']; hairColor: string }) {
  switch (id) {
    case 'hat':
      return (
        <g fill={hairColor}>
          <rect x="24" y="18" width="52" height="8" rx="3" />
          <rect x="32" y="5" width="36" height="16" rx="4" />
        </g>
      )
    case 'bow':
      return (
        <g fill="#E91E8C">
          <ellipse cx="35" cy="16" rx="10" ry="7" />
          <ellipse cx="65" cy="16" rx="10" ry="7" />
          <circle cx="50" cy="16" r="5" />
        </g>
      )
    case 'crown':
      return (
        <g fill="#F1C40F">
          <rect x="28" y="18" width="44" height="8" rx="2" />
          <polygon points="28,18 35,6 42,18" />
          <polygon points="43,18 50,6 57,18" />
          <polygon points="58,18 65,6 72,18" />
        </g>
      )
    case 'none':
    default:
      return null
  }
}

export default function AvatarRenderer({ avatar, size = 80, className = '' }: Props) {
  const outfit = getOutfit(avatar.outfitId)
  const width = size
  const height = Math.round(size * 1.2)

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 120"
      className={className}
      aria-label="Player avatar"
    >
      <rect x="28" y="78" width="44" height="38" rx="8" fill={outfit.color} />
      <rect x="42" y="78" width="16" height="12" rx="4" fill={outfit.accent} />
      <rect x="44" y="70" width="12" height="12" rx="4" fill={avatar.skinTone} />
      <ellipse cx="50" cy="50" rx="26" ry="28" fill={avatar.skinTone} />
      <HairShape style={avatar.hairStyle} color={avatar.hairColor} />
      <ellipse cx="24" cy="52" rx="4" ry="6" fill={avatar.skinTone} />
      <ellipse cx="76" cy="52" rx="4" ry="6" fill={avatar.skinTone} />
      <EyeShape style={avatar.eyeStyle} />
      <ellipse cx="50" cy="62" rx="3" ry="2" fill="rgba(0,0,0,0.12)" />
      <path d="M 40 68 Q 50 75 60 68" stroke="rgba(0,0,0,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <AccessoryShape id={avatar.accessoryId} hairColor={avatar.hairColor} />
    </svg>
  )
}
