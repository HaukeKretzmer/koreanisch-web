import { getDueCardsIn, getAllCards } from './cards.js'
import { VOCAB_COLLECTION } from './vocab.js'

export async function getDueCards(now = new Date()) {
  return getDueCardsIn(VOCAB_COLLECTION, now)
}

// Fällige Karten im Produktionsmodus (eigenes SRS-Feldset in `productionSrs`). Karten, die noch
// nie im Produktionsmodus geübt wurden, haben kein productionSrs und gelten als sofort fällig -
// das lässt sich nicht per Firestore-where-Filter auf ein fehlendes verschachteltes Feld abbilden,
// daher wird hier client-seitig gefiltert.
export async function getDueProductionCards(now = new Date()) {
  const vocabCards = await getAllCards(VOCAB_COLLECTION)
  const tagged = vocabCards.map((card) => ({ ...card, collection: VOCAB_COLLECTION }))
  const dueMillis = (card) => card.productionSrs?.dueDate?.toMillis?.() ?? 0
  return tagged
    .filter((card) => dueMillis(card) <= now.getTime())
    .sort((a, b) => dueMillis(a) - dueMillis(b))
}
