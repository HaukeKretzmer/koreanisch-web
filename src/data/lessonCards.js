import { getAllVocab } from './vocab.js'
import { getAllGrammar } from './grammar.js'

// Alle Karten (Vokabeln + Grammatik) einer Lektion, unabhängig vom Fälligkeitsstatus.
export async function getLessonCards(lessonId) {
  const [vocab, grammar] = await Promise.all([getAllVocab(), getAllGrammar()])
  const vocabCards = vocab
    .filter((card) => card.lessonId === lessonId)
    .map((card) => ({ ...card, collection: 'vocabulary' }))
  const grammarCards = grammar
    .filter((card) => card.lessonId === lessonId)
    .map((card) => ({ ...card, collection: 'grammar' }))
  return [...vocabCards, ...grammarCards]
}
