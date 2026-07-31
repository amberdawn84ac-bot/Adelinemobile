import { LifeMapEntry, Track, GradeBand, GRADE_EXPECTATIONS, CREDITS_PER_ENTRY, CreditSummary, PortfolioEntry } from '../types/game'

export function getGradeExpectation(band: GradeBand) {
  return GRADE_EXPECTATIONS.find(g => g.band === band) ?? GRADE_EXPECTATIONS[0]
}

export function calculateCredits(entries: LifeMapEntry[]): Partial<Record<Track, number>> {
  const credits: Partial<Record<Track, number>> = {}
  for (const entry of entries) {
    for (const track of entry.tracks) {
      credits[track] = (credits[track] ?? 0) + CREDITS_PER_ENTRY
    }
  }
  return credits
}

export function buildCreditSummary(
  entries: LifeMapEntry[],
  gradeBand: GradeBand
): CreditSummary[] {
  const expectation = getGradeExpectation(gradeBand)
  const credits = calculateCredits(entries)
  const perTrackGoal = expectation.minCreditsPerYear / expectation.requiredTracks.length

  return expectation.requiredTracks.map(track => {
    const earned = credits[track] ?? 0
    return {
      track,
      credits: Math.round(earned * 10) / 10,
      entriesCount: entries.filter(e => e.tracks.includes(track)).length,
      meetsYearGoal: earned >= perTrackGoal,
      creditsNeeded: Math.max(0, Math.round((perTrackGoal - earned) * 10) / 10)
    }
  })
}

export function checkGraduationEligible(
  entries: LifeMapEntry[],
  gradeBand: GradeBand
): { eligible: boolean; totalCredits: number; creditsNeeded: number; tracksComplete: number; tracksRequired: number } {
  const expectation = getGradeExpectation(gradeBand)
  const credits = calculateCredits(entries)
  const perTrackGoal = expectation.minCreditsPerYear / expectation.requiredTracks.length

  const totalCredits = Object.values(credits).reduce((sum, c) => sum + (c ?? 0), 0)
  const tracksComplete = expectation.requiredTracks.filter(t => (credits[t] ?? 0) >= perTrackGoal).length
  const creditsNeeded = Math.max(0, expectation.minCreditsPerYear - totalCredits)

  return {
    eligible: tracksComplete === expectation.requiredTracks.length && totalCredits >= expectation.minCreditsPerYear,
    totalCredits: Math.round(totalCredits * 10) / 10,
    creditsNeeded: Math.round(creditsNeeded * 10) / 10,
    tracksComplete,
    tracksRequired: expectation.requiredTracks.length
  }
}

export function buildPortfolio(entries: LifeMapEntry[]): PortfolioEntry[] {
  return entries.map(entry => ({
    id: entry.id,
    description: entry.description,
    tracks: entry.tracks,
    credits: entry.tracks.length * CREDITS_PER_ENTRY,
    date: entry.created_at
  }))
}

export function getYearProgress(entries: LifeMapEntry[], gradeBand: GradeBand): number {
  const expectation = getGradeExpectation(gradeBand)
  const credits = calculateCredits(entries)
  const total = Object.values(credits).reduce((sum, c) => sum + (c ?? 0), 0)
  return Math.min(100, Math.round((total / expectation.minCreditsPerYear) * 100))
}

export function gradeBandFromAge(age: number | null): GradeBand {
  if (!age) return 'K-2'
  if (age <= 8)  return 'K-2'
  if (age <= 11) return '3-5'
  if (age <= 14) return '6-8'
  return '9-12'
}
