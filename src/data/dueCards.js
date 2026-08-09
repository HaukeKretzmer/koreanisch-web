import { getDueCardsIn, getAllCards } from './cards.js'
import { VOCAB_COLLECTION } from './vocab.js'
import { GRAMMAR_COLLECTION } from './grammar.js'

// Fällige Vokabel- und Grammatikkarten zusammengeführt, sortiert nach Fälligkeit.
export async function getDueCards(now = new Date()) {
  const [vocabCards, grammarCards] = await Promise.all([
    getDueCardsIn(VOCAB_COLLECTION, now),
    getDueCardsIn(GRAMMAR_COLLECTION, now),
  ])
  return [...vocabCards, ...grammarCards].sort(
    (a, b) => a.dueDate.toMillis() - b.dueDate.toMillis(),
  )
}

// Fällige Karten im Produktionsmodus (eigenes SRS-Feldset in `productionSrs`). Karten, die noch
// nie im Produktionsmodus geübt wurden, haben kein productionSrs und gelten als sofort fällig -
// das lässt sich nicht per Firestore-where-Filter auf ein fehlendes verschachteltes Feld abbilden,
// daher wird hier client-seitig gefiltert.
export async function getDueProductionCards(now = new Date()) {
  const [vocabCards, grammarCards] = await Promise.all([
    getAllCards(VOCAB_COLLECTION),
    getAllCards(GRAMMAR_COLLECTION),
  ])
  const tagged = [
    ...vocabCards.map((card) => ({ ...card, collection: VOCAB_COLLECTION })),
    ...grammarCards.map((card) => ({ ...card, collection: GRAMMAR_COLLECTION })),
  ]
  const dueMillis = (card) => card.productionSrs?.dueDate?.toMillis?.() ?? 0
  return tagged
    .filter((card) => dueMillis(card) <= now.getTime())
    .sort((a, b) => dueMillis(a) - dueMillis(b))
}
