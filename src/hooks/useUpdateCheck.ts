import { useEffect, useState } from 'react'

interface UpdateInfo {
  latestVersion: string
  releaseUrl: string
  hasUpdate: boolean
}

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // 1x täglich
const LAST_CHECK_KEY = 'dmr-dashboard-update-checked'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO // z.B. "do2ef/dmr-dashboard"

export function useUpdateCheck(): UpdateInfo | null {
  const [info, setInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    if (!GITHUB_REPO) return

    const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) ?? 0)
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return

    fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
      .then(r => r.json())
      .then((data: { tag_name?: string; html_url?: string }) => {
        if (!data.tag_name) return
        localStorage.setItem(LAST_CHECK_KEY, String(Date.now()))
        const latestVersion = data.tag_name.replace(/^v/, '')
        const current = __APP_VERSION__
        setInfo({
          latestVersion,
          releaseUrl: data.html_url ?? `https://github.com/${GITHUB_REPO}/releases`,
          hasUpdate: latestVersion !== current,
        })
      })
      .catch(() => {})
  }, [])

  return info
}
