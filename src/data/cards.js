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
  writeBatch,
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

// Getrennter Fortschritt für den Produktionsmodus (Deutsch -> Koreanisch), unabhängig von den
// Erkennungs-SRS-Feldern oben. Ersetzt das gesamte productionSrs-Objekt (kein Teil-Merge), da
// sm2Update immer einen vollständigen neuen Zustand liefert.
export async function updateProductionSrsFields(collectionName, id, srsFields) {
  await setDoc(
    cardDoc(collectionName, id),
    { productionSrs: { ...srsFields }, updatedAt: serverTimestamp() },
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

// Firestore erlaubt max. 500 Schreiboperationen pro Batch.
const BATCH_CHUNK_SIZE = 400

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Bulk-Variante von upsertContentPreservingSrs für den Import: schreibt viele Karten über
// Firestore-Batches statt einzeln mit je einem vorherigen getDoc, um Massenimporte nicht durch
// hunderte sequenzielle Round-Trips auszubremsen. existingIds muss vorher (z.B. für die
// Import-Vorschau) einmalig geladen worden sein.
export async function bulkUpsertContentPreservingSrs(collectionName, items, existingIds) {
  const chunks = chunk(items, BATCH_CHUNK_SIZE)
  for (const items of chunks) {
    const batch = writeBatch(db)
    const now = serverTimestamp()
    for (const { id, ...contentFields } of items) {
      const payload = { ...contentFields, updatedAt: now }
      if (!existingIds.has(id)) {
        Object.assign(payload, {
          ...SRS_DEFAULTS,
          dueDate: new Date(),
          lastReviewedAt: null,
          createdAt: now,
        })
      }
      batch.set(cardDoc(collectionName, id), payload, { merge: true })
    }
    await batch.commit()
  }
}
