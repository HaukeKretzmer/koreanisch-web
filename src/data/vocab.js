import { getAllCards, updateSrsFields, upsertContentPreservingSrs } from './cards.js'

export const VOCAB_COLLECTION = 'vocabulary'

export function getAllVocab() {
  return getAllCards(VOCAB_COLLECTION)
}

export function updateVocabSrs(id, srsFields) {
  return updateSrsFields(VOCAB_COLLECTION, id, srsFields)
}

export function upsertVocabContent(id, contentFields) {
  return upsertContentPreservingSrs(VOCAB_COLLECTION, id, contentFields)
}
