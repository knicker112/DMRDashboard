/**
 * Wird automatisch vor "npm run dev" ausgeführt (predev).
 * Prüft ob radioid.json existiert und weniger als 7 Tage alt ist.
 * Falls nicht, startet es das Update im Hintergrund ohne den Start zu blockieren.
 */

import { existsSync, statSync } from 'fs'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

function checkAndUpdate(dbPath, scriptName, label) {
  const exists = existsSync(dbPath)
  const needsUpdate = !exists || (Date.now() - statSync(dbPath).mtimeMs) > MAX_AGE_MS

  if (needsUpdate) {
    const ageDays = exists ? Math.floor((Date.now() - statSync(dbPath).mtimeMs) / 86400000) : null
    const reason = ageDays === null ? 'nicht vorhanden' : `${ageDays} Tage alt`
    console.log(`[${label}] Datenbank ${reason} — Update wird im Hintergrund gestartet...`)
    const child = spawn('node', [join(__dir, scriptName)], { detached: true, stdio: 'ignore' })
    child.unref()
  } else {
    const ageDays = Math.floor((Date.now() - statSync(dbPath).mtimeMs) / 86400000)
    console.log(`[${label}] Datenbank ist ${ageDays} Tag(e) alt — kein Update nötig.`)
  }
}

checkAndUpdate(join(__dir, '../public/radioid.json'), 'fetch-radioid.mjs', 'RadioID')
checkAndUpdate(join(__dir, '../public/talkgroups.json'), 'fetch-talkgroups.mjs', 'Talkgroups')
