import { auth } from '../firebase.js'

export function requireUid() {
  const uid = auth.currentUser?.uid
  if (!uid) {
    throw new Error('Kein angemeldeter Nutzer.')
  }
  return uid
}
