import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { requireUid } from './uid.js'

function testResultsCollection() {
  return collection(db, 'users', requireUid(), 'testResults')
}

export async function saveTestResult({ correct, total }) {
  await addDoc(testResultsCollection(), {
    correct,
    total,
    createdAt: serverTimestamp(),
  })
}

export async function getRecentTestResults(count = 10) {
  const recentQuery = query(testResultsCollection(), orderBy('createdAt', 'desc'), limit(count))
  const snapshot = await getDocs(recentQuery)
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
}

export async function deleteAllTestResults() {
  const snapshot = await getDocs(testResultsCollection())
  await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)))
}
