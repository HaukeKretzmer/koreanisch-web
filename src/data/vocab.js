import { getAllCards, getCard, updateSrsFields, upsertContentPreservingSrs } from './cards.js'

export const VOCAB_COLLECTION = 'vocabulary'

export function getAllVocab() {
  return getAllCards(VOCAB_COLLECTION)
}

export function getVocab(id) {
  return getCard(VOCAB_COLLECTION, id)
}

export function updateVocabSrs(id, srsFields) {
  return updateSrsFields(VOCAB_COLLECTION, id, srsFields)
}

export function upsertVocabContent(id, contentFields) {
  return upsertContentPreservingSrs(VOCAB_COLLECTION, id, contentFields)
}
