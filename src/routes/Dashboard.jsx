import { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import { getAllLessons } from '../data/lessons.js'
import { getDueCards } from '../data/dueCards.js'

// Temporärer Debug-Block für Schritt 5 (Data-Access-Schicht) – wird in Schritt 11
// durch das echte Dashboard ersetzt.
function DataAccessDebug() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function runChecks() {
    setError('')
    try {
      const [vocab, grammar, lessons, due] = await Promise.all([
        getAllVocab(),
        getAllGrammar(),
        getAllLessons(),
        getDueCards(),
      ])
      setResult({ vocab, grammar, lessons, due })
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    runChecks()
  }, [])

  return (
    <div>
      <h2>Debug: Data-Access-Schicht (Schritt 5)</h2>
      <button type="button" onClick={runChecks}>
        Neu laden
      </button>
      {error && <p role="alert">{error}</p>}
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Angemeldet als {user?.email}</p>
      <button type="button" onClick={() => signOut(auth)}>
        Abmelden
      </button>
      <DataAccessDebug />
    </div>
  )
}
