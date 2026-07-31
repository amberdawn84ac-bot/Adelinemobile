import { useState } from 'react'

interface Props {
  x: number
  y: number
  onChat: () => void
}

export default function AdelineNPC({ x, y, onChat }: Props) {
  const [showPrompt, setShowPrompt] = useState(false)

  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer group"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      onMouseEnter={() => setShowPrompt(true)}
      onMouseLeave={() => setShowPrompt(false)}
      onClick={onChat}
    >
      {showPrompt && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-3 py-2 shadow-lg whitespace-nowrap z-10">
          <p className="text-xs font-semibold text-slate-700">Talk to Adeline</p>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white" />
        </div>
      )}
      <div className="w-16 h-16 rounded-full border-4 border-amber-400 shadow-xl overflow-hidden group-hover:border-amber-300 transition-all group-hover:scale-105">
        <img
          src="/adeline_portrait.png"
          alt="Adeline"
          className="w-full h-full object-cover"
          onError={e => {
            const target = e.currentTarget
            target.style.display = 'none'
            target.parentElement!.style.backgroundColor = '#D97706'
            target.parentElement!.innerHTML = '<span style="color:white;font-size:24px;display:flex;align-items:center;justify-content:center;height:100%">A</span>'
          }}
        />
      </div>
      <span className="text-white text-xs font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full">Adeline</span>
    </div>
  )
}
