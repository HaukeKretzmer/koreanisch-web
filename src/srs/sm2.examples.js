// Manuelles Beispiel-Skript, kein Teil des Builds.
// Ausführen mit: node src/srs/sm2.examples.js
import { sm2Update } from './sm2.js'

const now = new Date('2026-01-01T00:00:00Z')
const freshCard = { repetitions: 0, easeFactor: 2.5, intervalDays: 0 }

console.log('quality 0 (Nochmal) auf frischer Karte:')
console.log(sm2Update(freshCard, 0, now))
// erwartet: repetitions 0, intervalDays 1

console.log('\nquality 3 (Schwer) auf frischer Karte:')
console.log(sm2Update(freshCard, 3, now))
// erwartet: repetitions 1, intervalDays 1, easeFactor sinkt leicht

console.log('\nquality 5 (Leicht) wiederholt (3x hintereinander) auf frischer Karte:')
let card = freshCard
for (let i = 1; i <= 3; i++) {
  card = sm2Update(card, 5, now)
  console.log(`Durchgang ${i}:`, card)
}
// erwartet: intervalDays wächst (1 -> 6 -> deutlich größer), easeFactor steigt

console.log('\neaseFactor-Untergrenze bei wiederholt schlechter Bewertung (quality 0):')
let strugglingCard = { repetitions: 5, easeFactor: 1.35, intervalDays: 20 }
for (let i = 1; i <= 5; i++) {
  strugglingCard = sm2Update(strugglingCard, 0, now)
}
console.log(strugglingCard)
// erwartet: easeFactor fällt nie unter 1.3
