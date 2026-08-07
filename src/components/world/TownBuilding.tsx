import { TownBuilding as TownBuildingType } from '../../types/game'

interface Props {
  building: TownBuildingType
  isNearby: boolean
  isLocked: boolean
  onEnter: () => void
}

const accents: Record<string,string> = {
  adelines_kitchen:'#9d3f56',
  the_library:'#315d6f',
  the_arena:'#6b3a31',
  the_makers_lab:'#296b61',
  the_creek_and_woods:'#3f6a4b',
  the_market:'#8b5b28',
  the_chapel:'#5a4576',
}

export default function TownBuilding({ building, isNearby, isLocked, onEnter }: Props) {
  const accent = accents[building.id] ?? '#5d4a3a'

  return (
    <div
      className="absolute flex flex-col items-center group"
      style={{ left:`${building.position.x}%`, top:`${building.position.y}%`, transform:'translate(-50%,-50%)', zIndex:isNearby ? 18 : 10 }}
    >
      {isNearby && (
        <button
          type="button"
          onClick={!isLocked ? onEnter : undefined}
          className="absolute -top-14 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#332d25]/20 bg-[#f5efdf]/95 px-4 py-2 font-serif text-[10px] tracking-[0.14em] text-[#342f28] shadow-xl backdrop-blur"
        >
          {isLocked ? 'not open yet' : 'go in'}
        </button>
      )}

      <button
        type="button"
        aria-label={`Enter ${building.name}`}
        onClick={!isLocked ? onEnter : undefined}
        className={`relative h-[108px] w-[128px] transition-all duration-300 ${isLocked ? 'opacity-45 grayscale' : 'cursor-pointer'} ${isNearby ? 'scale-110' : 'group-hover:scale-[1.04]'}`}
      >
        {building.id === 'adelines_kitchen' && <Cottage accent={accent} />}
        {building.id === 'the_library' && <Library accent={accent} />}
        {building.id === 'the_arena' && <OldHall accent={accent} />}
        {building.id === 'the_makers_lab' && <Workshop accent={accent} />}
        {building.id === 'the_creek_and_woods' && <WoodsGate accent={accent} />}
        {building.id === 'the_market' && <Storefront accent={accent} />}
        {building.id === 'the_chapel' && <Chapel accent={accent} />}
        {isNearby && !isLocked && <span className="absolute inset-3 -z-10 rounded-[38%] opacity-35 blur-2xl" style={{background:accent}} />}
      </button>

      <div className="mt-0.5 max-w-[145px] text-center">
        <p className="font-serif text-[13px] font-semibold leading-tight text-[#2d2924] drop-shadow-[0_1px_0_rgba(255,255,255,.65)]">{building.name}</p>
        {isNearby && !isLocked && <p className="mt-1 text-[9px] italic leading-tight text-[#4d463e]/70">{building.description}</p>}
      </div>
    </div>
  )
}

function Cottage({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[17px] top-[29px] h-[68px] w-[94px] rotate-[.5deg] border-[2.5px] border-[#342d26] bg-[#e9dfc8] shadow-lg" />
    <span className="absolute left-[10px] top-[12px] h-[43px] w-[108px] -rotate-[2deg] border-[2.5px] border-[#342d26] bg-[#786552]" style={{clipPath:'polygon(50% 0,100% 74%,92% 100%,8% 100%,0 74%)'}} />
    <span className="absolute left-[55px] top-[60px] h-[37px] w-[23px] border-2 border-[#342d26]" style={{background:accent}} />
    <span className="absolute left-[28px] top-[56px] h-[18px] w-[18px] border-2 border-[#342d26] bg-[#b7d8d1]" />
    <span className="absolute right-[24px] top-[54px] h-[20px] w-[20px] border-2 border-[#342d26] bg-[#d7c570]" />
    <span className="absolute left-[5px] bottom-[8px] h-[14px] w-[32px] rounded-full border-b-2 border-[#41543f]" />
    <span className="absolute right-[2px] bottom-[9px] h-[15px] w-[36px] rounded-full border-b-2 border-[#41543f]" />
  </>
}

function Library({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[19px] top-[23px] h-[75px] w-[91px] -rotate-[.8deg] border-[2.5px] border-[#322c25] bg-[#d7ccb5] shadow-lg" />
    <span className="absolute left-[13px] top-[16px] h-[16px] w-[104px] rotate-[.7deg] border-2 border-[#322c25] bg-[#a68c70]" />
    {[30,51,72,93].map(x=><span key={x} className="absolute top-[34px] h-[54px] w-[5px] border-x border-[#42392f]/60 bg-[#c8b89d]" style={{left:x}} />)}
    <span className="absolute left-[53px] top-[57px] h-[41px] w-[25px] rounded-t-[45%] border-2 border-[#322c25]" style={{background:accent}} />
    <span className="absolute left-[25px] top-[44px] h-[18px] w-[18px] rounded-t-full border-2 border-[#322c25] bg-[#a9c5cf]" />
    <span className="absolute right-[22px] top-[44px] h-[18px] w-[18px] rounded-t-full border-2 border-[#322c25] bg-[#a9c5cf]" />
  </>
}

function OldHall({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[15px] top-[37px] h-[61px] w-[99px] rotate-[.6deg] border-[2.5px] border-[#322b24] bg-[#c8b396] shadow-lg" />
    <span className="absolute left-[8px] top-[21px] h-[31px] w-[113px] -rotate-[1deg] border-[2.5px] border-[#322b24] bg-[#71584a]" style={{clipPath:'polygon(8% 100%,22% 15%,78% 15%,92% 100%)'}} />
    <span className="absolute left-[49px] top-[58px] h-[40px] w-[31px] border-2 border-[#322b24]" style={{background:accent}} />
    <span className="absolute left-[23px] top-[51px] h-[17px] w-[17px] border-2 border-[#322b24] bg-[#c9d7cf]" />
    <span className="absolute right-[21px] top-[51px] h-[17px] w-[17px] border-2 border-[#322b24] bg-[#c9d7cf]" />
    <span className="absolute left-[34px] top-[28px] h-[5px] w-[60px] bg-[#d6c19e] border-y border-[#322b24]/60" />
  </>
}

function Workshop({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[13px] top-[36px] h-[62px] w-[105px] -rotate-[.7deg] border-[2.5px] border-[#302a24] bg-[#bba88d] shadow-lg" />
    <span className="absolute left-[7px] top-[18px] h-[30px] w-[117px] rotate-[1deg] border-[2.5px] border-[#302a24] bg-[#5d5b50]" style={{clipPath:'polygon(4% 100%,13% 15%,91% 2%,97% 100%)'}} />
    <span className="absolute left-[45px] top-[56px] h-[42px] w-[43px] border-2 border-[#302a24]" style={{background:accent}} />
    <span className="absolute left-[20px] top-[53px] h-[20px] w-[18px] border-2 border-[#302a24] bg-[#a7c8c2]" />
    <span className="absolute right-[12px] top-[42px] h-[40px] w-[8px] rotate-[8deg] bg-[#443a30]" />
  </>
}

function WoodsGate({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[17px] bottom-[8px] h-[77px] w-[17px] -rotate-[7deg] rounded-[50%_50%_12%_12%] border-2 border-[#2f342b] bg-[#524936]" />
    <span className="absolute right-[16px] bottom-[8px] h-[82px] w-[18px] rotate-[8deg] rounded-[50%_50%_12%_12%] border-2 border-[#2f342b] bg-[#524936]" />
    <span className="absolute left-[15px] top-[8px] h-[58px] w-[98px] rounded-[50%_50%_40%_40%] border-2 border-[#2f342b] bg-[#4c694c]/85" />
    <span className="absolute left-[37px] top-[28px] h-[67px] w-[55px] rounded-t-[50%] border-2 border-[#2f342b] bg-[#d6d0b8]/70" />
    <span className="absolute left-[49px] top-[49px] h-[28px] w-[31px] rounded-t-[50%] border border-[#2f342b]" style={{background:accent, opacity:.72}} />
  </>
}

function Storefront({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[14px] top-[30px] h-[68px] w-[102px] rotate-[.5deg] border-[2.5px] border-[#332c25] bg-[#e0d2b9] shadow-lg" />
    <span className="absolute left-[10px] top-[22px] h-[18px] w-[110px] -rotate-[1deg] border-2 border-[#332c25]" style={{background:accent}} />
    <span className="absolute left-[23px] top-[42px] h-[24px] w-[32px] border-2 border-[#332c25] bg-[#b9d0cd]" />
    <span className="absolute right-[22px] top-[42px] h-[24px] w-[32px] border-2 border-[#332c25] bg-[#b9d0cd]" />
    <span className="absolute left-[51px] top-[68px] h-[30px] w-[27px] border-2 border-[#332c25] bg-[#735746]" />
    <span className="absolute left-[22px] top-[16px] h-[10px] w-[83px] border border-[#332c25] bg-[#f1e6d0]" />
  </>
}

function Chapel({accent}:{accent:string}) {
  return <>
    <span className="absolute left-[27px] top-[31px] h-[67px] w-[75px] rotate-[.5deg] border-[2.5px] border-[#312b25] bg-[#d9cfbb] shadow-lg" />
    <span className="absolute left-[21px] top-[11px] h-[40px] w-[87px] -rotate-[1deg] border-[2.5px] border-[#312b25] bg-[#7b6d60]" style={{clipPath:'polygon(50% 0,100% 100%,0 100%)'}} />
    <span className="absolute left-[51px] top-[59px] h-[39px] w-[26px] rounded-t-[48%] border-2 border-[#312b25]" style={{background:accent}} />
    <span className="absolute left-[56px] top-[37px] h-[14px] w-[14px] rounded-t-full border-2 border-[#312b25] bg-[#9fb9c1]" />
    <span className="absolute left-[63px] top-[2px] h-[17px] w-[3px] bg-[#312b25]" />
    <span className="absolute left-[57px] top-[7px] h-[3px] w-[15px] bg-[#312b25]" />
  </>
}
