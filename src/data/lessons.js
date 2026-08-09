import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'
import { requireUid } from './uid.js'

function lessonsCollection() {
  return collection(db, 'users', requireUid(), 'lessons')
}

export async function getAllLessons() {
  const snapshot = await getDocs(lessonsCollection())
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function getLesson(id) {
  const snapshot = await getDoc(doc(db, 'users', requireUid(), 'lessons', id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function upsertLesson(id, contentFields) {
  const ref = doc(db, 'users', requireUid(), 'lessons', id)
  const existing = await getDoc(ref)
  const payload = { ...contentFields, importedAt: serverTimestamp() }
  if (!existing.exists()) {
    payload.created_at = contentFields.created_at ?? serverTimestamp()
  }
  await setDoc(ref, payload, { merge: true })
}
