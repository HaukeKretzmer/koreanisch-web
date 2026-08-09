import { getAllCards, updateSrsFields, upsertContentPreservingSrs } from './cards.js'

export const GRAMMAR_COLLECTION = 'grammar'

export function getAllGrammar() {
  return getAllCards(GRAMMAR_COLLECTION)
}

export function updateGrammarSrs(id, srsFields) {
  return updateSrsFields(GRAMMAR_COLLECTION, id, srsFields)
}

export function upsertGrammarContent(id, contentFields) {
  return upsertContentPreservingSrs(GRAMMAR_COLLECTION, id, contentFields)
}
