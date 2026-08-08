import { useState, useEffect, useCallback, useRef } from 'react'
import { AvatarData, PlayerState, TOWN_BUILDINGS, BuildingId, LifeMapEntry, Track, ActivityType } from '../../types/game'
import AvatarRenderer from '../avatar/AvatarRenderer'
import TownBuilding from './TownBuilding'
import ActivityPicker from '../game/ActivityPicker'
import { TownBuilding as TownBuildingType } from '../../types/game'

const MOVE_SPEED = 1.15
const BUILDING_PROXIMITY = 12
const DISCOVERY_PROXIMITY = 8

interface Props {
  avatarData: AvatarData
  playerName: string
  studentId: string | null
  currentXP: number
  onEnterBuilding: (buildingId: BuildingId, mode: ActivityType, track: Track | null, suggestedTopic: string | null) => void
  onEnterKitchen: () => void
  onStartCreekCase: () => void
  onXpEarned: (amount: number) => void
  onCoinsEarned: (amount: number) => void
  onLifeMapEntry: (entry: LifeMapEntry) => void
}

interface Discovery {
  id: string
  x: number
  y: number
  mark: string
  title: string
  body: string
  note: string
  accent: string
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

const littleTrees = [
  {x:3,y:36,s:.75},{x:8,y:47,s:1},{x:13,y:68,s:.8},{x:18,y:34,s:.65},
  {x:87,y:36,s:.75},{x:93,y:48,s:1.05},{x:96,y:67,s:.8},{x:82,y:72,s:.65},
  {x:28,y:31,s:.6},{x:73,y:30,s:.65},{x:5,y:82,s:.65},{x:91,y:84,s:.7}
]

const flowers = [
  {x:17,y:77,c:'#782f52'},{x:20,y:80,c:'#315b70'},{x:24,y:75,c:'#b8862b'},
  {x:76,y:79,c:'#68417d'},{x:80,y:75,c:'#286c5b'},{x:83,y:81,c:'#9c3d55'},
  {x:46,y:64,c:'#315b70'},{x:54,y:67,c:'#782f52'}
]

const CREEK_DISCOVERIES: Discovery[] = [
  { id:'fish', x:53, y:74, mark:'⌇', title:'Something in the shallows', body:'Three small fish are floating belly-up where the creek bends. The water here has a faint cloudy sheen.', note:'Dead fish + cloudy water. Check upstream before deciding what caused it.', accent:'#315f70' },
  { id:'bottle', x:61, y:62, mark:'◇', title:'A blue glass bottle', body:'A little cobalt bottle is caught between two roots. The label is gone, but there is a sharp mineral smell around the cap.', note:'Unknown bottle upstream. Do not assume it is the source. Keep looking for a route into the creek.', accent:'#345f91' },
  { id:'pipe', x:67, y:51, mark:'◒', title:'The old drain', body:'Behind nettles and stones, an iron pipe disappears beneath the road. Damp orange residue marks the soil below it.', note:'Drainage pipe enters the creek. Orange residue suggests minerals or rust, but the source is still unknown.', accent:'#9a4e35' },
  { id:'paper', x:31, y:42, mark:'⌁', title:'A torn delivery slip', body:'A rain-softened scrap has been pinned under a stone. Most of the ink is gone, but one line remains: “Mill Road — drums — Thursday.”', note:'Delivery slip mentions drums and Mill Road. Enough clues now to investigate the water instead of guessing.', accent:'#6f4d73' },
]

export default function HubWorld({ avatarData, playerName, studentId, currentXP, onEnterBuilding, onEnterKitchen, onStartCreekCase }: Props) {
  const [player, setPlayer] = useState<PlayerState>({ x:50, y:82, facing:'up' })
  const keysPressed = useRef<Set<string>>(new Set())
  const animFrame = useRef<number | undefined>(undefined)
  const playerRef = useRef(player)
  playerRef.current = player

  const [pickerBuilding, setPickerBuilding] = useState<TownBuildingType | null>(null)
  const [openDiscovery, setOpenDiscovery] = useState<Discovery | null>(null)
  const [foundIds, setFoundIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('adeline_creek_clues') ?? '[]') }
    catch { return [] }
  })

  useEffect(() => { localStorage.setItem('adeline_creek_clues', JSON.stringify(foundIds)) }, [foundIds])

  const movePlayer = useCallback(() => {
    setPlayer(prev => {
      let { x, y, facing } = prev
      if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w') || keysPressed.current.has('W')) { y -= MOVE_SPEED; facing = 'up' }
      if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s') || keysPressed.current.has('S')) { y += MOVE_SPEED; facing = 'down' }
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a') || keysPressed.current.has('A')) { x -= MOVE_SPEED; facing = 'left' }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d') || keysPressed.current.has('D')) { x += MOVE_SPEED; facing = 'right' }
      return { x:Math.max(4,Math.min(96,x)), y:Math.max(19,Math.min(92,y)), facing }
    })
    animFrame.current = requestAnimationFrame(movePlayer)
  }, [])

  const nearbyDiscovery = CREEK_DISCOVERIES.find(d => distance(player.x,player.y,d.x,d.y) < DISCOVERY_PROXIMITY)
  const nearbyBuilding = TOWN_BUILDINGS.find(b => distance(player.x,player.y,b.position.x,b.position.y) < BUILDING_PROXIMITY)

  const interactNearby = useCallback(() => {
    const p = playerRef.current
    const discovery = CREEK_DISCOVERIES.find(d => distance(p.x,p.y,d.x,d.y) < DISCOVERY_PROXIMITY)
    if (discovery) {
      setOpenDiscovery(discovery)
      setFoundIds(prev => prev.includes(discovery.id) ? prev : [...prev,discovery.id])
      return
    }
    for (const b of TOWN_BUILDINGS) {
      if (distance(p.x,p.y,b.position.x,b.position.y) < BUILDING_PROXIMITY) {
        if (b.unlockXP > currentXP) return
        if (b.id === 'adelines_kitchen') { onEnterKitchen(); return }
        setPickerBuilding(b)
        return
      }
    }
  }, [currentXP,onEnterKitchen])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      keysPressed.current.add(e.key)
      if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') interactNearby()
      if (e.key === 'Escape') { setPickerBuilding(null); setOpenDiscovery(null) }
    }
    function onKeyUp(e: KeyboardEvent) { keysPressed.current.delete(e.key) }
    window.addEventListener('keydown',onKeyDown)
    window.addEventListener('keyup',onKeyUp)
    animFrame.current = requestAnimationFrame(movePlayer)
    return () => {
      window.removeEventListener('keydown',onKeyDown)
      window.removeEventListener('keyup',onKeyUp)
      if (animFrame.current) cancelAnimationFrame(animFrame.current)
    }
  }, [movePlayer,interactNearby])

  function startMobileMove(key: string) { keysPressed.current.add(key) }
  function stopMobileMove(key: string) { keysPressed.current.delete(key) }

  const allCluesFound = foundIds.length >= CREEK_DISCOVERIES.length
  const activeNearby = nearbyDiscovery ?? nearbyBuilding

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#ebe3cf] text-[#2d2924] touch-none">
      <div className="absolute inset-0" style={{background:'linear-gradient(180deg,#eee8db 0%,#d9d6c7 27%,#9caf91 48%,#73856a 72%,#5f6e59 100%)'}} />
      <div className="absolute inset-0 opacity-[0.23] pointer-events-none mix-blend-multiply" style={{backgroundImage:'radial-gradient(#3c342a 0.6px,transparent 0.7px)',backgroundSize:'5px 5px'}} />
      <div className="absolute left-[-8%] top-[26%] w-[62%] h-[29%] rounded-[50%] bg-[#718068]/75 border-t-2 border-[#2f342c]/30" style={{transform:'rotate(3deg)'}} />
      <div className="absolute right-[-9%] top-[23%] w-[66%] h-[32%] rounded-[50%] bg-[#66765f]/80 border-t-2 border-[#2f342c]/30" style={{transform:'rotate(-3deg)'}} />
      <div className="absolute top-[13%] right-[13%] w-14 h-14 rounded-full bg-[#c8952f]/75 shadow-[0_0_55px_rgba(200,149,47,.42)] border border-[#6c5529]/20" />
      <div className="absolute left-[36%] top-[47%] w-[30%] h-[58%] bg-[#315f70]/75 border-x-2 border-[#243f49]/25 shadow-inner" style={{clipPath:'polygon(45% 0,58% 8%,43% 18%,63% 29%,47% 40%,68% 53%,53% 66%,66% 80%,44% 100%,25% 100%,43% 80%,30% 67%,45% 55%,31% 41%,47% 30%,34% 18%)'}} />
      <div className="absolute left-[22%] top-[42%] w-[58%] h-[55%] bg-[#c1aa83]/70 border-x border-[#5f5141]/20" style={{clipPath:'polygon(43% 0,57% 0,67% 29%,59% 47%,70% 72%,79% 100%,25% 100%,37% 72%,31% 48%,38% 28%)'}} />

      {littleTrees.map((t,i) => <div key={i} className="absolute" style={{left:`${t.x}%`,top:`${t.y}%`,transform:`scale(${t.s})`,zIndex:5}}><div className="relative w-12 h-16 -translate-x-1/2"><span className="absolute left-1/2 bottom-0 w-[3px] h-9 bg-[#3d352d] -translate-x-1/2 rotate-[-2deg]"/><span className="absolute left-[6px] top-[11px] w-10 h-10 rounded-[48%_52%_43%_57%] border-2 border-[#2e332b]/60 bg-[#4f684e]/55 rotate-[-7deg]"/><span className="absolute left-[15px] top-[2px] w-8 h-10 rounded-[55%_45%_58%_42%] border-2 border-[#2e332b]/55 bg-[#61775b]/50 rotate-[9deg]"/><span className="absolute left-0 top-[23px] w-8 h-8 rounded-full border border-[#2e332b]/50 bg-[#536b51]/45"/></div></div>)}
      {flowers.map((f,i) => <div key={i} className="absolute z-[7]" style={{left:`${f.x}%`,top:`${f.y}%`}}><div className="w-[2px] h-5 bg-[#394235]/70"/><div className="absolute -left-[5px] -top-[3px] w-3 h-3 rounded-full border border-[#302a24]/45" style={{background:f.c,boxShadow:`0 0 10px ${f.c}55`}}/></div>)}
      {[{x:40,y:56},{x:61,y:58},{x:44,y:72},{x:66,y:77}].map((l,i)=><div key={i} className="absolute z-[9]" style={{left:`${l.x}%`,top:`${l.y}%`}}><div className="w-[2px] h-7 bg-[#40372e]"/><div className="absolute -left-[5px] top-0 w-3 h-4 rounded-sm border border-[#40372e] bg-[#d39b36]/85 shadow-[0_0_15px_rgba(211,155,54,.72)]"/></div>)}

      {CREEK_DISCOVERIES.map(d => {
        const found = foundIds.includes(d.id)
        const close = nearbyDiscovery?.id === d.id
        return <button key={d.id} type="button" onClick={() => {setOpenDiscovery(d);setFoundIds(prev=>prev.includes(d.id)?prev:[...prev,d.id])}} className="absolute z-[17] flex items-center justify-center rounded-full transition-all" style={{left:`${d.x}%`,top:`${d.y}%`,width:close?32:20,height:close?32:20,transform:'translate(-50%,-50%)',color:d.accent}} aria-label={`Inspect ${d.title}`}><span className={`${close?'opacity-100 scale-110':found?'opacity-45':'opacity-20'} text-xl drop-shadow`}>{d.mark}</span>{close&&<span className="absolute inset-0 rounded-full border border-current animate-ping opacity-25"/>}</button>
      })}

      {TOWN_BUILDINGS.map(building => <TownBuilding key={building.id} building={building} isNearby={nearbyBuilding?.id===building.id&&!nearbyDiscovery} isLocked={building.unlockXP>currentXP} onEnter={()=>{if(building.id==='adelines_kitchen'){onEnterKitchen();return}setPickerBuilding(building)}}/>)}

      <div className="absolute flex flex-col items-center" style={{left:`${player.x}%`,top:`${player.y}%`,transform:'translate(-50%,-50%)',zIndex:30,filter:'drop-shadow(0 6px 8px rgba(35,30,23,.3))'}}><div className="relative"><div className="absolute inset-1 rounded-full bg-[#e7dec8]/80 blur-md"/><AvatarRenderer avatar={avatarData} size={66}/></div><p className="mt-0.5 px-2.5 py-1 rounded-full bg-[#f4eddc]/88 border border-[#352f27]/15 font-serif text-[11px] shadow-sm">{playerName}</p></div>

      {activeNearby&&!pickerBuilding&&!openDiscovery&&<div className="absolute left-1/2 bottom-[88px] -translate-x-1/2 z-40 pointer-events-none"><div className="px-4 py-2 rounded-full bg-[#f5efdf]/92 border border-[#332d25]/20 shadow-lg text-[11px] font-serif whitespace-nowrap">{nearbyDiscovery?'Something here catches your eye.':nearbyBuilding&&nearbyBuilding.unlockXP>currentXP?'The way is closed for now.':`${nearbyBuilding?.name} is close.`}</div></div>}

      {allCluesFound&&!openDiscovery&&!pickerBuilding&&<button onClick={onStartCreekCase} className="absolute left-1/2 top-[18%] -translate-x-1/2 z-40 max-w-[280px] px-5 py-3 rounded-[18px] border border-[#372f27]/20 bg-[#f3ebd8]/95 shadow-xl text-left"><span className="block text-[9px] tracking-[.23em] uppercase text-[#6e655a]">field note</span><span className="block font-serif text-[15px] text-[#2e2922] mt-1">You have enough clues to test the creek instead of guessing.</span><span className="block text-[10px] text-[#6a5f52] mt-2">open the field laboratory →</span></button>}

      <div className="absolute left-4 bottom-4 z-40 sm:hidden w-[122px] h-[122px] rounded-full bg-[#efe7d4]/35 border border-[#332d25]/10 backdrop-blur-[1px]">
        {[{k:'ArrowUp',label:'↑',cls:'left-[43px] top-[5px]'},{k:'ArrowLeft',label:'←',cls:'left-[5px] top-[43px]'},{k:'ArrowRight',label:'→',cls:'right-[5px] top-[43px]'},{k:'ArrowDown',label:'↓',cls:'left-[43px] bottom-[5px]'}].map(c=><button key={c.k} aria-label={`Move ${c.label}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);startMobileMove(c.k)}} onPointerUp={()=>stopMobileMove(c.k)} onPointerCancel={()=>stopMobileMove(c.k)} onPointerLeave={()=>stopMobileMove(c.k)} className={`absolute ${c.cls} w-9 h-9 rounded-full bg-[#f5efdf]/78 border border-[#332d25]/20 shadow-md text-[#3a332b] active:scale-95`}>{c.label}</button>)}
      </div>

      <button type="button" onClick={interactNearby} disabled={!activeNearby} className="absolute right-5 bottom-7 sm:bottom-5 z-40 w-[70px] h-[70px] rounded-full border-2 border-[#3b332a]/25 bg-[#5b3769]/90 text-[#fff8e9] font-serif text-[12px] shadow-[0_8px_24px_rgba(49,35,55,.3)] disabled:opacity-20 disabled:grayscale">{nearbyDiscovery?'inspect':'enter'}</button>
      <div className="hidden sm:block absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.15em] uppercase text-[#29251f]/55 z-30">WASD to wander · E to interact</div>

      {openDiscovery&&<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#17140f]/45 backdrop-blur-[1px]" onClick={()=>setOpenDiscovery(null)}><div className="w-full sm:max-w-md rounded-t-[30px] sm:rounded-[30px] border border-[#30291f]/20 bg-[#f5eedc] p-6 shadow-[0_24px_80px_rgba(22,18,13,.45)]" onClick={e=>e.stopPropagation()}><div className="flex items-start gap-4"><div className="w-11 h-11 rounded-full border border-[#332d25]/20 flex items-center justify-center font-serif text-2xl" style={{color:openDiscovery.accent}}>{openDiscovery.mark}</div><div className="flex-1"><p className="text-[9px] tracking-[.25em] uppercase text-[#766b5e]">found near the creek</p><h3 className="font-serif text-[24px] leading-tight text-[#2d2924] mt-1">{openDiscovery.title}</h3></div><button onClick={()=>setOpenDiscovery(null)} className="text-[#5e554a]/60 text-xl">×</button></div><p className="mt-5 font-serif text-[15px] leading-relaxed text-[#463e34]">{openDiscovery.body}</p><div className="mt-5 border-l-2 pl-4" style={{borderColor:openDiscovery.accent}}><p className="text-[9px] uppercase tracking-[.2em] text-[#766b5e]">your field note</p><p className="mt-1 text-[12px] leading-relaxed text-[#5b5145] italic">{openDiscovery.note}</p></div><div className="mt-6 flex items-center justify-between"><span className="text-[10px] text-[#766b5e]">{foundIds.length} of {CREEK_DISCOVERIES.length} clues noticed</span><button onClick={()=>setOpenDiscovery(null)} className="px-5 py-2 rounded-full bg-[#5b3769] text-[#fff8e9] font-serif text-[12px]">keep looking</button></div></div></div>}

      {pickerBuilding&&<ActivityPicker building={pickerBuilding} studentId={studentId} onSelect={(mode,track,topic)=>{const selectedBuilding=pickerBuilding;setPickerBuilding(null);onEnterBuilding(selectedBuilding.id,mode,track,topic)}} onClose={()=>setPickerBuilding(null)}/>}    
    </div>
  )
}
