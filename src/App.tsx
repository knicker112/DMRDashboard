import { useEffect } from 'react'
import { useBrandmeister } from './hooks/useBrandmeister'
import { useRadioId } from './hooks/useRadioId'
import { SlotCard } from './components/SlotCard'
import { HistoryRow } from './components/HistoryRow'

const HOTSPOT_ID = '264474201'

export default function App() {
  const { state, dispatch } = useBrandmeister(HOTSPOT_ID)
  const { lookup, fetchUser } = useRadioId()

  useEffect(() => {
    async function resolveUser(slot: 1 | 2, dmrId: number) {
      await fetchUser(dmrId)
      const user = lookup(dmrId)
      if (user) {
        dispatch({
          type: 'SET_USER',
          slot,
          name: `${user.fname} ${user.surname}`.trim(),
          location: user.city && user.country ? `${user.city}, ${user.country}` : user.country,
        })
      }
    }

    if (state.slot1.active && state.slot1.dmrId && !state.slot1.name) {
      void resolveUser(1, state.slot1.dmrId)
    }
    if (state.slot2.active && state.slot2.dmrId && !state.slot2.name) {
      void resolveUser(2, state.slot2.dmrId)
    }
  }, [state.slot1.active, state.slot1.dmrId, state.slot2.active, state.slot2.dmrId])

  return (
    <div className="min-h-screen bg-slate-950 p-4 font-mono">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${state.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <h1 className="text-sky-400 text-sm font-bold tracking-widest">
              DMR HOTSPOT · {HOTSPOT_ID}
            </h1>
          </div>
          <span className="text-xs text-slate-600">
            {state.connected ? 'VERBUNDEN' : 'GETRENNT'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <SlotCard slot={1} state={state.slot1} />
          <SlotCard slot={2} state={state.slot2} />
        </div>

        {state.history.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-medium tracking-widest mb-2">
              LETZTE AKTIVITÄT
            </div>
            {state.history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {!state.connected && (
          <div className="text-center text-slate-600 text-xs mt-8">
            Verbinde mit BrandMeister…
          </div>
        )}
      </div>
    </div>
  )
}
