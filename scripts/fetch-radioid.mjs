/**
 * Lädt die RadioID-Datenbank für D/A/CH herunter und speichert sie
 * als kompakte Lookup-Datei in public/radioid.json.
 *
 * Format: { "2630309": { "c": "DB7ST", "n": "Christoph", "l": "Herzogenrath" } }
 *
 * Ausführen: npm run update-radioid
 * Cron (wöchentlich): 0 4 * * 0 cd /home/christian/dmr-dashboard && npm run update-radioid
 */

import { writeFileSync } from 'fs'

const BASE = 'https://www.radioid.net/api/dmr/user/'
const PER_PAGE = 200
const COUNTRIES = ['Germany', 'Austria', 'Switzerland']

async function fetchPage(country, page) {
  const url = `${BASE}?country=${encodeURIComponent(country)}&page=${page}&per_page=${PER_PAGE}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
  return r.json()
}

async function fetchCountry(country) {
  process.stdout.write(`${country}: `)
  const first = await fetchPage(country, 1)
  const totalPages = first.pages
  const results = [...first.results]
  process.stdout.write(`${first.count} Einträge, ${totalPages} Seiten `)

  for (let p = 2; p <= totalPages; p++) {
    const data = await fetchPage(country, p)
    results.push(...data.results)
    process.stdout.write('.')
    // Kurze Pause um die API nicht zu überlasten
    await new Promise(r => setTimeout(r, 50))
  }
  console.log(` ✓`)
  return results
}

console.log('RadioID D/A/CH Datenbank herunterladen...\n')

const lookup = {}
for (const country of COUNTRIES) {
  const users = await fetchCountry(country)
  for (const u of users) {
    lookup[u.id] = {
      c: u.callsign,
      n: u.fname || '',
      l: u.city || u.state || '',
    }
  }
}

const outPath = new URL('../public/radioid.json', import.meta.url)
writeFileSync(outPath, JSON.stringify(lookup))

console.log(`\n✓ ${Object.keys(lookup).length} Einträge gespeichert → public/radioid.json`)
