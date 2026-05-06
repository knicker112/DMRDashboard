import type { TalkgroupEntry } from '../types'

interface Props {
  talkgroups: TalkgroupEntry[]
}

export function SubscribedTGs({ talkgroups }: Props) {
  if (talkgroups.length === 0) return null

  const slot1 = talkgroups.filter(t => t.slot === 1)
  const slot2 = talkgroups.filter(t => t.slot === 2)

  return (
    <div className="bg-slate-800 rounded-xl p-5 mb-6">
      <div className="text-sm text-slate-300 font-bold tracking-widest mb-4">
        ABONNIERTE TALKGROUPS
      </div>
      <div className="flex flex-col gap-3">
        {[{ label: 'TS1', entries: slot1 }, { label: 'TS2', entries: slot2 }].map(({ label, entries }) =>
          entries.length > 0 && (
            <div key={label} className="flex items-start gap-3">
              <span className="text-slate-400 font-bold text-sm w-8 pt-1 shrink-0">{label}</span>
              <div className="flex flex-wrap gap-2">
                {entries.map(tg => (
                  <span
                    key={tg.talkgroup}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold
                      ${tg.type === 1
                        ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                        : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }
                    `}
                  >
                    <span className="text-xs opacity-70">{tg.talkgroup}</span>
                    <span>{tg.callsign}</span>
                    {tg.type === 1 && <span className="text-amber-400 text-xs">★</span>}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
