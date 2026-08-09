import { getDueCardsIn } from './cards.js'
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
