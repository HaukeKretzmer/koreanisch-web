import { getAllVocab } from './vocab.js'

// Alle Vokabelkarten einer Lektion, unabhängig vom Fälligkeitsstatus.
export async function getLessonCards(lessonId) {
  const vocab = await getAllVocab()
  return vocab
    .filter((card) => card.lessonId === lessonId)
    .map((card) => ({ ...card, collection: 'vocabulary' }))
}
