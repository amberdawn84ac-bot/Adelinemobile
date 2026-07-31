import { AvatarData } from '../../types/game'

export const SKIN_TONES = [
  { label: 'Porcelain', value: '#FDDBB4' },
  { label: 'Fair',      value: '#F4C89A' },
  { label: 'Medium',    value: '#D4956A' },
  { label: 'Tan',       value: '#C07A4A' },
  { label: 'Deep',      value: '#7D4E2A' },
  { label: 'Rich',      value: '#4A2810' },
]

export const HAIR_COLORS = [
  { label: 'Black',      value: '#1A0A00' },
  { label: 'Dark Brown', value: '#3D2314' },
  { label: 'Brown',      value: '#6B3A2A' },
  { label: 'Auburn',     value: '#922B21' },
  { label: 'Blonde',     value: '#D4A843' },
  { label: 'Strawberry', value: '#E8735A' },
  { label: 'Red',        value: '#C0392B' },
  { label: 'Silver',     value: '#BDC3C7' },
  { label: 'White',      value: '#ECF0F1' },
  { label: 'Blue',       value: '#2980B9' },
  { label: 'Purple',     value: '#8E44AD' },
  { label: 'Pink',       value: '#E91E8C' },
  { label: 'Teal',       value: '#16A085' },
]

export const HAIR_STYLES: { id: AvatarData['hairStyle']; label: string }[] = [
  { id: 'short',    label: 'Short' },
  { id: 'long',     label: 'Long' },
  { id: 'curly',    label: 'Curly' },
  { id: 'braids',   label: 'Braids' },
  { id: 'ponytail', label: 'Ponytail' },
]

export const EYE_STYLES: { id: AvatarData['eyeStyle']; label: string }[] = [
  { id: 'round',  label: 'Round' },
  { id: 'almond', label: 'Almond' },
  { id: 'wide',   label: 'Wide' },
]

export const OUTFITS: { id: AvatarData['outfitId']; label: string; color: string; accent: string }[] = [
  { id: 'red',    label: 'Red',    color: '#E74C3C', accent: '#C0392B' },
  { id: 'blue',   label: 'Blue',   color: '#3498DB', accent: '#2980B9' },
  { id: 'green',  label: 'Green',  color: '#27AE60', accent: '#1E8449' },
  { id: 'purple', label: 'Purple', color: '#9B59B6', accent: '#7D3C98' },
  { id: 'orange', label: 'Orange', color: '#E67E22', accent: '#CA6F1E' },
  { id: 'teal',   label: 'Teal',   color: '#16A085', accent: '#0E6655' },
]

export const ACCESSORIES: { id: AvatarData['accessoryId']; label: string; emoji: string }[] = [
  { id: 'none',  label: 'None',  emoji: '∅' },
  { id: 'hat',   label: 'Hat',   emoji: '🎩' },
  { id: 'bow',   label: 'Bow',   emoji: '🎀' },
  { id: 'crown', label: 'Crown', emoji: '👑' },
]

export function getOutfit(id: AvatarData['outfitId']) {
  return OUTFITS.find(o => o.id === id) ?? OUTFITS[1]
}
