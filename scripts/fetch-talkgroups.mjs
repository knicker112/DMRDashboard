/**
 * Lädt alle registrierten BrandMeister-Talkgroups herunter und speichert
 * sie als kompakte Lookup-Datei in public/talkgroups.json.
 *
 * Format: { "262997": "DACH Intern", "263112": "HiOrg-Talk EmComm", ... }
 *
 * Ausführen: npm run update-talkgroups
 */

import { writeFileSync, readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dir, '../public/talkgroups.json')
const manualPath = join(__dir, '../public/talkgroups-manual.json')

console.log('BrandMeister Talkgroup-Datenbank herunterladen...')

const r = await fetch('https://api.brandmeister.network/v2/talkgroup/')
if (!r.ok) throw new Error(`HTTP ${r.status}`)

// API liefert direkt { "ID": "Name", ... }
const data = await r.json()

// Manuelle Einträge einmergen (überschreiben API-Daten, bleiben bei Updates erhalten)
if (existsSync(manualPath)) {
  const manual = JSON.parse(readFileSync(manualPath, 'utf8'))
  Object.assign(data, manual)
  console.log(`  + ${Object.keys(manual).length} manuelle Einträge aus talkgroups-manual.json`)
}

writeFileSync(outPath, JSON.stringify(data))
console.log(`✓ ${Object.keys(data).length} Talkgroups gespeichert → public/talkgroups.json`)
