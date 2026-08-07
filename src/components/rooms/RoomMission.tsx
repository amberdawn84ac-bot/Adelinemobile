import { useState, useEffect } from 'react'
import { Track, GradeBand, FallbackMission } from '../../types/game'
import { generateLesson, recordCompletion, recordTranscriptCredit } from '../../lib/brainClient'

interface Props {
  roomId: string
  roomLabel: string
  roomEmoji: string
  roomTracks: Track[]
  playerName: string
  systemContext: string
  studentId: string | null
  gradeBand: GradeBand
  stormMission?: FallbackMission
  onComplete: (description: string, tracks: Track[], xp: number, coins: number) => void
  onBack: () => void
}

interface Mission {
  title: string
  description: string
  prompt: string
  xpReward: number
  coinReward: number
  lessonId?: string
  fromBrain?: boolean
}

export default function RoomMission({
  roomId, roomLabel, roomTracks, playerName,
  systemContext, studentId, gradeBand, stormMission, onComplete, onBack
}: Props) {
  const [mission, setMission] = useState<Mission | null>(null)
  const [response, setResponse] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [evaluating, setEvaluating] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => { loadMission() }, [])

  async function loadMission() {
    if (stormMission) {
      setMission({ ...stormMission, fromBrain: false })
      setLoading(false)
      return
    }

    setLoading(true)

    if (studentId) {
      const lesson = await generateLesson({
        student_id: studentId,
        track: roomTracks[0],
        topic: 'auto',
        is_homestead: true,
        grade_level: gradeBand,
        render_mode: 'standard_lesson',
      })

      if (lesson && lesson.blocks?.length > 0) {
        const descBlock = lesson.blocks.find(b => b.type === 'NARRATIVE' || b.type === 'TEXT') ?? lesson.blocks[0]
        const promptBlock = lesson.blocks.find(b => b.type === 'RESEARCH_MISSION' || b.type === 'LAB_MISSION')
        setMission({
          title: lesson.title,
          description: descBlock.content,
          prompt: promptBlock?.content ?? `Based on what you found about “${lesson.title},” record what matters most and what you still want to know.`,
          xpReward: 75,
          coinReward: 18,
          lessonId: lesson.lesson_id,
          fromBrain: true,
        })
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Create a grounded real-world discovery for a student who has entered ${roomLabel}. ${systemContext}\n\nIt must feel like something the student noticed, found, needs to solve, repair, investigate, compare, document, or decide. Do not call it a lesson, assignment, activity, challenge, or educational mission. Avoid praise language and classroom language. It should connect naturally to real life, homesteading, farming, nature, history, a town, or community and be completable in 5-15 minutes.\n\nRespond ONLY with valid JSON:\n{"title":"...","description":"...2-3 sentences setting up what was found or what is happening...","prompt":"...the concrete thing the player needs to work out or record...","xpReward":60,"coinReward":15}`,
          history: [],
        })
      })
      const data = await res.json()
      const parsed = JSON.parse(data.reply.replace(/\`\`\`json|\`\`\`/g, '').trim())
      if (parsed.title && parsed.prompt) setMission({ ...parsed, fromBrain: false })
      else throw new Error('bad format')
    } catch {
      setMission(getFallbackMission(roomId))
    } finally {
      setLoading(false)
    }
  }

  async function submitResponse() {
    if (!response.trim() || !mission) return
    setEvaluating(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `A student named ${playerName} investigated this situation:\nTitle: "${mission.title}"\nWhat they needed to work out: "${mission.prompt}"\nTheir field note: "${response}"\n\nRespond as a concise knowledgeable mentor, not a teacher grading homework. In 2-3 sentences, say what in their reasoning is supported, point out one thing that needs correction or deeper evidence if applicable, and give one useful next clue or question. Do not say great job, awesome, amazing, mission complete, or use motivational filler.`,
          history: [],
        })
      })
      const data = await res.json()
      setFeedback(data.reply)
      setCompleted(true)

      const description = `${mission.title}: ${response.slice(0, 120)}${response.length > 120 ? '...' : ''}`
      onComplete(description, roomTracks, mission.xpReward, mission.coinReward)

      if (studentId && mission.lessonId) {
        recordCompletion(studentId, mission.lessonId, roomTracks[0], mission.title)
        recordTranscriptCredit(studentId, mission.lessonId, roomTracks[0], mission.title)
      }
    } catch {
      setFeedback('Your note has been saved. Revisit it later if new evidence changes what you think.')
      setCompleted(true)
      onComplete(response.slice(0, 120), roomTracks, mission?.xpReward ?? 40, mission?.coinReward ?? 10)
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="relative h-full overflow-hidden bg-[#d8d0bc] text-[#2e2923]">
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage:'radial-gradient(#4b4134 .55px, transparent .7px)', backgroundSize:'5px 5px' }} />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#234f50]/10 blur-3xl" />
      <div className="absolute -left-24 bottom-[-90px] h-80 w-80 rounded-full bg-[#6c2e55]/10 blur-3xl" />

      <button
        onClick={onBack}
        className="absolute left-4 top-4 z-30 rounded-full border border-[#3c342b]/20 bg-[#f4eddb]/90 px-4 py-2 font-serif text-xs shadow-md backdrop-blur"
      >
        ← town
      </button>

      <div className="relative z-10 h-full overflow-y-auto px-4 pb-10 pt-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          {loading ? (
            <div className="mt-[16vh] text-center font-serif text-[#5a5044]">
              <div className="mx-auto mb-5 h-10 w-10 rounded-full border border-[#3a3128]/30 bg-[#c69a38]/25 shadow-[0_0_30px_rgba(198,154,56,.24)] animate-pulse" />
              <p className="text-sm italic">Something here is worth looking at…</p>
            </div>
          ) : mission && !completed ? (
            <div className="relative rounded-[28px_22px_30px_20px] border border-[#463b30]/25 bg-[#f3ecd9]/95 p-6 shadow-[0_22px_55px_rgba(55,44,32,.22)] sm:p-9">
              <div className="absolute right-8 top-0 h-12 w-px rotate-[13deg] bg-[#6a5745]/20" />
              <div className="absolute left-8 top-8 h-2 w-2 rounded-full bg-[#295d58] shadow-[0_0_12px_rgba(41,93,88,.45)]" />
              <p className="mb-6 pl-5 font-serif text-[10px] uppercase tracking-[0.24em] text-[#766957]">field note · {roomLabel}</p>

              <h1 className="font-serif text-2xl leading-tight text-[#28231e] sm:text-3xl">{mission.title}</h1>
              <p className="mt-4 max-w-2xl font-serif text-[15px] leading-7 text-[#51483e]">{mission.description}</p>

              <div className="my-7 h-px bg-gradient-to-r from-transparent via-[#5c5043]/35 to-transparent" />

              <p className="font-serif text-[15px] font-semibold leading-6 text-[#2f2a24]">{mission.prompt}</p>

              <div className="relative mt-5">
                <textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Write what you notice, calculate, decide, sketch in words, or still need to figure out…"
                  className="h-44 w-full resize-none rounded-[18px_14px_20px_13px] border border-[#55483b]/25 bg-[#fffaf0]/65 px-4 py-4 font-serif text-sm leading-6 text-[#302a24] outline-none placeholder:text-[#877968] focus:border-[#295d58]/60 focus:ring-2 focus:ring-[#295d58]/10"
                />
                <span className="absolute bottom-3 right-4 font-serif text-[9px] text-[#877968]">field journal</span>
              </div>

              <div className="mt-5 flex items-center justify-end">
                <button
                  onClick={submitResponse}
                  disabled={response.trim().length < 20 || evaluating}
                  className="rounded-full border border-[#254c49]/30 bg-[#295d58] px-6 py-2.5 font-serif text-sm text-[#fff9eb] shadow-md transition hover:bg-[#214844] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {evaluating ? 'checking the evidence…' : 'save note'}
                </button>
              </div>
            </div>
          ) : completed && feedback ? (
            <div className="relative rounded-[24px_30px_22px_28px] border border-[#463b30]/25 bg-[#f3ecd9]/95 p-6 shadow-[0_22px_55px_rgba(55,44,32,.22)] sm:p-9">
              <p className="font-serif text-[10px] uppercase tracking-[0.24em] text-[#766957]">Adeline’s margin note</p>
              <p className="mt-5 font-serif text-[16px] leading-7 text-[#3d362e]">{feedback}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button onClick={onBack} className="rounded-full border border-[#3f372e]/20 bg-[#fffaf0]/60 px-5 py-2.5 font-serif text-sm text-[#3c352d]">
                  back outside
                </button>
                <button
                  onClick={() => { setCompleted(false); setResponse(''); setFeedback(null); loadMission() }}
                  className="rounded-full border border-[#5b2e50]/25 bg-[#6a355d] px-5 py-2.5 font-serif text-sm text-[#fff7ea] shadow-md"
                >
                  look around again
                </button>
              </div>
              <p className="mt-7 font-serif text-[10px] italic text-[#847665]">Saved quietly to your learning record.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function getFallbackMission(roomId: string): Mission {
  const missions: Record<string, Mission> = {
    the_library: { title: 'A Margin That Shouldn’t Be Here', description: 'An old local-history book has a penciled note in the margin that disagrees with the printed account. The note names a family, a date, and a payment that the book never mentions.', prompt: 'What would you need to verify before trusting the handwritten note? List at least three pieces of evidence you would look for and explain which would be strongest.', xpReward: 60, coinReward: 15 },
    the_arena: { title: 'The Numbers Don’t Match', description: 'Two town notices give different totals for the same project. One says the materials cost $480. Another lists twelve identical items at $37.50 each plus a $45 delivery charge.', prompt: 'Work out the second total. Does either notice appear wrong? Record your calculation and what you would check next.', xpReward: 60, coinReward: 15 },
    the_makers_lab: { title: 'The Crooked Gate', description: 'The old garden gate drags across the ground every time it opens. One hinge is loose and the diagonal brace has shifted.', prompt: 'Describe how you would diagnose what is causing the sag. What measurements or simple tests would tell you whether the hinge, frame, or brace is the main problem?', xpReward: 65, coinReward: 18 },
    the_creek_and_woods: { title: 'Something Changed Upstream', description: 'The water below the footbridge is cloudier than it was yesterday, and a thin line of debris is caught high on the bank.', prompt: 'What are three possible explanations? What observations could help you tell runoff, erosion, flooding, or pollution apart?', xpReward: 65, coinReward: 18 },
    the_market: { title: 'Why Did the Price Jump?', description: 'A jar of local honey is suddenly several dollars more expensive, even though the jar size has not changed. The beekeeper, shopkeeper, and customer each give a different explanation.', prompt: 'List the costs or market changes that could reasonably raise the price. Which explanation would you investigate first, and what information would you ask for?', xpReward: 70, coinReward: 18 },
    the_chapel: { title: 'A Verse in the Margin', description: 'A worn Bible on a side table has one passage underlined twice, with a date written beside it. There is no explanation.', prompt: 'Read the passage carefully in context. Record what it actually says, what it does not say, and one question you would ask before assuming why it mattered to the person who marked it.', xpReward: 60, coinReward: 15 },
  }
  return missions[roomId] ?? { title:'An Unfinished Note', description:'Someone left a page here with one important piece missing.', prompt:'What can you infer from what is present, and what evidence would you need before drawing a conclusion?', xpReward:50, coinReward:12 }
}
