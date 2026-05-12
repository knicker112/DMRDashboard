import { useState, useEffect, useCallback } from 'react'

interface CallsignInfo {
  firstName: string
  city: string | null
}

export function useCallsigns() {
  const [data, setData] = useState<Record<string, CallsignInfo>>({})

  useEffect(() => {
    fetch('./callsigns.json')
      .then(r => r.json())
      .then((json: { callsigns?: Record<string, CallsignInfo> }) => {
        if (json.callsigns) setData(json.callsigns)
      })
      .catch(() => {})
  }, [])

  const lookup = useCallback(
    (callsign: string): CallsignInfo | null => data[callsign.toUpperCase()] ?? null,
    [data],
  )

  return { lookup }
}
