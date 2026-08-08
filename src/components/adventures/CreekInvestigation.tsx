import { useMemo, useState } from 'react'
import { Track } from '../../types/game'

interface Props {
  playerName: string
  onBack: () => void
  onComplete: (description: string, tracks: Track[], xp: number, coins: number) => void
}

type SampleId = 'upstream' | 'drain' | 'downstream'
type TestId = 'ph' | 'turbidity' | 'conductivity'

type ResultMap = Record<SampleId, Record<TestId, string>>

const RESULTS: ResultMap = {
  upstream: {
    ph: '7.1 — close to neutral',
    turbidity: '2 NTU — clear',
    conductivity: '180 µS/cm — ordinary creek water',
  },
  drain: {
    ph: '5.4 — noticeably acidic',
    turbidity: '19 NTU — cloudy',
    conductivity: '1,420 µS/cm — unusually high dissolved material',
  },
  downstream: {
    ph: '6.0 — acidic compared with upstream',
    turbidity: '12 NTU — cloudy',
    conductivity: '890 µS/cm — elevated',
  },
}

const SAMPLE_LABELS: Record<SampleId, string> = {
  upstream: 'Upstream jar',
  drain: 'Drain jar',
  downstream: 'Downstream jar',
}

const TEST_LABELS: Record<TestId, string> = {
  ph: 'pH paper',
  turbidity: 'Turbidity tube',
  conductivity: 'Conductivity meter',
}

const CONCLUSIONS = [
  {
    id: 'rain',
    label: 'Heavy rain stirred up harmless mud.',
    explanation: 'That could explain cloudiness, but not the strong acidity and conductivity centered at the drain.',
    correct: false,
  },
  {
    id: 'drain',
    label: 'Something entering through the old drain is changing the creek water.',
    explanation: 'That best fits the pattern. The drain sample is the strongest outlier, and the downstream water shifts in the same direction while upstream stays normal.',
    correct: true,
  },
  {
    id: 'bottle',
    label: 'The blue bottle definitely poisoned the creek.',
    explanation: 'The bottle is suspicious, but one object is not enough to prove cause. The measurements point to the drain, not specifically to the bottle.',
    correct: false,
  },
]

export default function CreekInvestigation({ playerName, onBack, onComplete }: Props) {
  const [selectedSample, setSelectedSample] = useState<SampleId>('upstream')
  const [tested, setTested] = useState<string[]>([])
  const [conclusion, setConclusion] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)

  const testedCount = tested.length
  const enoughEvidence = testedCount >= 6
  const currentConclusion = useMemo(() => CONCLUSIONS.find(c => c.id === conclusion) ?? null, [conclusion])

  function runTest(test: TestId) {
    const key = `${selectedSample}:${test}`
    if (!tested.includes(key)) setTested(prev => [...prev, key])
  }

  function hasTest(sample: SampleId, test: TestId) {
    return tested.includes(`${sample}:${test}`)
  }

  function finishCase() {
    if (!currentConclusion?.correct || finished) return
    setFinished(true)
    onComplete(
      `${playerName} investigated the creek by comparing upstream, drain, and downstream water samples; used pH, turbidity, and conductivity evidence; and concluded that something entering through the old drain is changing creek chemistry.`,
      ['CREATION_SCIENCE', 'APPLIED_MATHEMATICS', 'ENGLISH_LITERATURE'],
      110,
      24,
    )
  }

  return (
    <div className="min-h-full overflow-y-auto bg-[#d8d1be] text-[#2b2823]" style={{ backgroundImage:'radial-gradient(rgba(48,42,34,.08) .7px, transparent .7px)', backgroundSize:'6px 6px' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-7 py-6 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button onClick={onBack} className="text-[10px] uppercase tracking-[.2em] text-[#675e53] hover:text-[#2d2924]">← creek road</button>
            <p className="mt-5 text-[10px] uppercase tracking-[.3em] text-[#71675a]">case no. 001 · field laboratory</p>
            <h1 className="font-serif text-3xl sm:text-5xl leading-none mt-2">The creek is wrong.</h1>
            <p className="font-serif text-sm sm:text-base mt-4 max-w-2xl text-[#51493f] leading-relaxed">
              You found enough clues to stop guessing. Compare water from three places and work out what the measurements actually support.
            </p>
          </div>
          <div className="hidden sm:block w-24 h-24 rounded-[42%_58%_45%_55%] border-2 border-[#315f70]/35 bg-[#315f70]/10 rotate-3 relative">
            <span className="absolute inset-0 flex items-center justify-center font-serif text-4xl text-[#315f70]">≈</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-5 mt-8">
          <section className="rounded-[28px] border border-[#332e27]/15 bg-[#f4eddb]/90 shadow-lg p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase tracking-[.23em] text-[#74695c]">water samples</p>
                <h2 className="font-serif text-2xl mt-1">Choose a jar</h2>
              </div>
              <span className="text-[10px] text-[#71675a]">{testedCount}/9 readings</span>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5">
              {(Object.keys(SAMPLE_LABELS) as SampleId[]).map(sample => (
                <button
                  key={sample}
                  onClick={() => setSelectedSample(sample)}
                  className={`relative min-h-28 rounded-[22px] border p-3 transition-all ${selectedSample === sample ? 'border-[#5b3769]/50 bg-[#fff9eb] shadow-md -translate-y-1' : 'border-[#352f27]/12 bg-white/25'}`}
                >
                  <div className="mx-auto w-10 h-14 rounded-b-[14px] border-2 border-[#454039]/40 bg-[#c7d8d4]/55 relative overflow-hidden">
                    <div className={`absolute inset-x-0 bottom-0 ${sample === 'upstream' ? 'h-[62%] bg-[#71939a]/45' : sample === 'drain' ? 'h-[74%] bg-[#876e55]/55' : 'h-[70%] bg-[#627e78]/52'}`} />
                    <div className="absolute -top-1 left-1 w-2 h-9 bg-white/25 rotate-6" />
                  </div>
                  <span className="block font-serif text-[12px] sm:text-sm mt-2 leading-tight">{SAMPLE_LABELS[sample]}</span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-[9px] uppercase tracking-[.23em] text-[#74695c]">tools on the bench</p>
              <div className="grid sm:grid-cols-3 gap-2 mt-3">
                {(Object.keys(TEST_LABELS) as TestId[]).map(test => (
                  <button
                    key={test}
                    onClick={() => runTest(test)}
                    className="rounded-2xl border border-[#332e27]/12 bg-[#fffaf0]/55 px-4 py-3 text-left hover:bg-[#fffaf0] active:scale-[.99] transition-all"
                  >
                    <span className="block font-serif text-[14px]">{TEST_LABELS[test]}</span>
                    <span className="block text-[10px] text-[#756b5e] mt-1">test {SAMPLE_LABELS[selectedSample].toLowerCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 border-t border-[#332e27]/10 pt-5">
              <p className="text-[9px] uppercase tracking-[.23em] text-[#74695c]">results for {SAMPLE_LABELS[selectedSample]}</p>
              <div className="space-y-2 mt-3">
                {(Object.keys(TEST_LABELS) as TestId[]).map(test => (
                  <div key={test} className="flex items-center justify-between gap-3 border-b border-[#332e27]/8 pb-2">
                    <span className="font-serif text-[13px]">{TEST_LABELS[test]}</span>
                    <span className={`text-[11px] text-right ${hasTest(selectedSample, test) ? 'text-[#3e584d]' : 'text-[#8a8176]'}`}>
                      {hasTest(selectedSample, test) ? RESULTS[selectedSample][test] : 'not tested'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#332e27]/15 bg-[#eee5cf]/94 shadow-lg p-5 sm:p-6">
            <p className="text-[9px] uppercase tracking-[.23em] text-[#74695c]">evidence board</p>
            <h2 className="font-serif text-2xl mt-1">What does the pattern say?</h2>
            <p className="text-[12px] text-[#61584d] mt-3 leading-relaxed">
              A good conclusion explains all three locations. Suspicion is not evidence. One weird object is not proof.
            </p>

            {!enoughEvidence ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#5b5146]/25 p-5 text-center">
                <div className="font-serif text-3xl text-[#315f70]">⌁</div>
                <p className="font-serif text-[14px] mt-2">You need more comparisons.</p>
                <p className="text-[10px] text-[#746b60] mt-1">Run at least six readings across the three jars before choosing a cause.</p>
              </div>
            ) : (
              <div className="space-y-2.5 mt-5">
                {CONCLUSIONS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setConclusion(c.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${conclusion === c.id ? 'border-[#5b3769]/45 bg-[#fff9ed] shadow-sm' : 'border-[#332e27]/12 bg-white/20 hover:bg-white/40'}`}
                  >
                    <span className="font-serif text-[14px] leading-snug">{c.label}</span>
                  </button>
                ))}
              </div>
            )}

            {currentConclusion && (
              <div className={`mt-5 rounded-2xl border p-4 ${currentConclusion.correct ? 'border-[#2d6f5a]/25 bg-[#dbe9de]/55' : 'border-[#8b5638]/20 bg-[#eadccf]/65'}`}>
                <p className="font-serif text-[14px]">{currentConclusion.correct ? 'That fits the evidence.' : 'Not enough to say that yet.'}</p>
                <p className="text-[11px] leading-relaxed text-[#5d5449] mt-2">{currentConclusion.explanation}</p>
              </div>
            )}

            {currentConclusion?.correct && !finished && (
              <button onClick={finishCase} className="mt-5 w-full py-3 rounded-full bg-[#5b3769] text-[#fff8e9] font-serif text-sm shadow-md">pin the conclusion to the case file</button>
            )}

            {finished && (
              <div className="mt-5 border-l-2 border-[#2d6f5a] pl-4 py-1">
                <p className="text-[9px] uppercase tracking-[.2em] text-[#617066]">case note saved</p>
                <p className="font-serif text-[15px] mt-1">The drain is the next lead, not the final answer.</p>
                <p className="text-[11px] text-[#61584d] mt-2">A later mission can trace where that pipe comes from, inspect records, and identify what was actually discharged.</p>
                <button onClick={onBack} className="mt-4 text-[11px] underline underline-offset-4 text-[#4e4262]">return to town</button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
