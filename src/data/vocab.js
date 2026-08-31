import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { requireUid } from './uid.js'
import { getAllCards, getCard, updateSrsFields, upsertContentPreservingSrs } from './cards.js'

export const VOCAB_COLLECTION = 'vocabulary'

export function getAllVocab() {
  return getAllCards(VOCAB_COLLECTION)
}

// Einmalige Aufräumfunktion, um den kompletten Vokabelbestand zu leeren (z.B. vor einem
// Neuaufbau mit einer neuen Vokabelliste). Löscht nur die Vokabelkarten, keine Lektionen.
export async function deleteAllVocab() {
  const cards = await getAllVocab()
  await Promise.all(
    cards.map((card) => deleteDoc(doc(db, 'users', requireUid(), VOCAB_COLLECTION, card.id))),
  )
  return cards.length
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
