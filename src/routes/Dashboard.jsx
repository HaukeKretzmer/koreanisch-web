import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import { getDueCards } from '../data/dueCards.js'

export default function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAllVocab(), getAllGrammar(), getDueCards()])
      .then(([vocab, grammar, due]) => {
        setCounts({ total: vocab.length + grammar.length, due: due.length })
      })
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Angemeldet als {user?.email}</p>
      <button type="button" onClick={() => signOut(auth)}>
        Abmelden
      </button>

      {error && <p role="alert">{error}</p>}
      {counts && (
        <div>
          <p>Fällige Karten heute: {counts.due}</p>
          <p>Karten insgesamt: {counts.total}</p>
        </div>
      )}

      <p>
        <Link to="/review">Review starten</Link>
      </p>
      <p>
        <Link to="/lessons">Lektionen</Link>
      </p>
      <p>
        <Link to="/import">Import</Link>
      </p>
      <p>
        <Link to="/vocab/new">Neue Vokabel</Link>
      </p>
      <p>
        <Link to="/stats">Statistik</Link>
      </p>
    </div>
  )
}
