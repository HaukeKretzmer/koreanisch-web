import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { requireUid } from './uid.js'

// SRS-Startwerte für neu angelegte Karten (siehe Plan, Abschnitt SM-2-Algorithmus)
export const SRS_DEFAULTS = {
  repetitions: 0,
  easeFactor: 2.5,
  intervalDays: 0,
}

function cardsCollection(collectionName) {
  return collection(db, 'users', requireUid(), collectionName)
}

function cardDoc(collectionName, id) {
  return doc(db, 'users', requireUid(), collectionName, id)
}

export async function getAllCards(collectionName) {
  const snapshot = await getDocs(cardsCollection(collectionName))
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function getCard(collectionName, id) {
  const snapshot = await getDoc(cardDoc(collectionName, id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function getDueCardsIn(collectionName, now) {
  const dueQuery = query(
    cardsCollection(collectionName),
    where('dueDate', '<=', now),
    orderBy('dueDate'),
  )
  const snapshot = await getDocs(dueQuery)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    collection: collectionName,
    ...docSnap.data(),
  }))
}

export async function updateSrsFields(collectionName, id, srsFields) {
  await setDoc(
    cardDoc(collectionName, id),
    { ...srsFields, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

// Merge-Write: Inhaltsfelder werden überschrieben, SRS-Felder nie angefasst.
// Existiert die Karte noch nicht, werden zusätzlich die SRS-Startwerte gesetzt.
export async function upsertContentPreservingSrs(collectionName, id, contentFields) {
  const ref = cardDoc(collectionName, id)
  const existing = await getDoc(ref)
  const payload = { ...contentFields, updatedAt: serverTimestamp() }

  if (!existing.exists()) {
    Object.assign(payload, {
      ...SRS_DEFAULTS,
      dueDate: new Date(),
      lastReviewedAt: null,
      createdAt: serverTimestamp(),
    })
  }

  await setDoc(ref, payload, { merge: true })
}
