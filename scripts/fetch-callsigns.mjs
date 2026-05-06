/**
 * Lädt die BNetzA-Rufzeichenliste (PDF) und konvertiert sie zu callsigns.json.
 * Ausführen: node scripts/fetch-callsigns.mjs
 * Wöchentlicher Cron (Sonntags 03:00):
 *   0 3 * * 0 cd /home/christian/dmr-dashboard && node scripts/fetch-callsigns.mjs >> /tmp/callsigns-update.log 2>&1
 */

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import https from 'https';

const PDF_URL =
  'https://data.bundesnetzagentur.de/Bundesnetzagentur/SharedDocs/Downloads/DE/Sachgebiete/Telekommunikation/Unternehmen_Institutionen/Frequenzen/Amateurfunk/Rufzeichenliste/rufzeichenliste_afu.pdf';
const OUTPUT = 'public/callsigns.json';

const TITLES = new Set(['Dr.', 'Dr', 'Prof.', 'Prof', 'Dipl.', 'Dipl', 'Ing.', 'Ing', 'Dr.-Ing.', 'B.Sc.', 'M.Sc.']);

async function downloadPdf(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadPdf(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function extractText(pdfBuffer) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    useSystemFonts: true,
    verbosity: 0,
  }).promise;

  const totalPages = doc.numPages;
  process.stdout.write(`Extrahiere Text aus ${totalPages} Seiten`);

  let fullText = '';
  for (let p = 1; p <= totalPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    fullText += tc.items.map(i => ('str' in i ? i.str : '')).join(' ') + ' ';
    if (p % 50 === 0) process.stdout.write('.');
  }
  process.stdout.write('\n');
  return fullText;
}

function extractFirstName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  for (const part of parts) {
    if (TITLES.has(part)) continue;
    if (/^[A-Z]\.$/.test(part)) continue; // Initialien wie "T."
    if (part.length === 0) continue;
    return part;
  }
  return parts[0] || null;
}

function extractCity(addressText) {
  // Suche "12345 Stadtname" — Straße & Hausnummer davor ignorieren
  const m = addressText.match(/\b\d{5}\s+([^\d,;]+)/);
  if (!m) return null;
  return m[1].trim().replace(/\s{2,}/g, ' ') || null;
}

function parseCallsigns(text) {
  const normalized = text.replace(/\s+/g, ' ');
  const result = {};

  // Pattern: "CALLSIGN , A/E/N , " — Klasse ist A, E oder N
  const entryRegex = /\b(D[A-Z]\d[A-Z]{1,5})\s*,\s*[AENaen]\s*,\s*/g;

  const positions = [];
  let m;
  while ((m = entryRegex.exec(normalized)) !== null) {
    positions.push({ call: m[1], nameStart: m.index + m[0].length, entryStart: m.index });
  }

  for (let i = 0; i < positions.length; i++) {
    // Segment endet am Start des nächsten Eintrags
    const end = i + 1 < positions.length ? positions[i + 1].entryStart : positions[i].nameStart + 300;
    const segment = normalized.slice(positions[i].nameStart, end).trim();

    // Name und Adresse trennen (Trennzeichen ist ;)
    const semiIdx = segment.indexOf(';');
    const namePart = semiIdx >= 0 ? segment.slice(0, semiIdx) : segment;
    const addrPart = semiIdx >= 0 ? segment.slice(semiIdx + 1) : '';

    const firstName = extractFirstName(namePart);
    const city = addrPart ? extractCity(addrPart) : null;

    if (firstName) {
      result[positions[i].call] = { firstName, city: city || null };
    }
  }

  return result;
}

// ---- Main ----
console.log(`Lade PDF von ${PDF_URL}`);
const pdfBuffer = await downloadPdf(PDF_URL);
console.log(`PDF geladen (${(pdfBuffer.length / 1024 / 1024).toFixed(1)} MB)`);

const text = await extractText(pdfBuffer);
console.log('Parsing...');
const callsigns = parseCallsigns(text);
const count = Object.keys(callsigns).length;

if (!existsSync('public')) mkdirSync('public');
writeFileSync(OUTPUT, JSON.stringify({ updated: new Date().toISOString(), count, callsigns }));
console.log(`✓ ${count} Rufzeichen → ${OUTPUT}`);
