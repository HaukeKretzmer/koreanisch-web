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
    <div className="page">
      <div className="top-bar">
        <h1>Dashboard</h1>
        <button type="button" className="btn btn-ghost" onClick={() => signOut(auth)}>
          Abmelden
        </button>
      </div>
      <p>Angemeldet als {user?.email}</p>

      {error && <p className="error-text" role="alert">{error}</p>}
      {counts && (
        <div className="stats-row">
          <div className="stat">
            <strong>{counts.due}</strong>
            <span>Fällig heute</span>
          </div>
          <div className="stat">
            <strong>{counts.total}</strong>
            <span>Karten insgesamt</span>
          </div>
        </div>
      )}

      <div className="nav-list">
        <Link className="nav-item" to="/review">
          Review starten
        </Link>
        <Link className="nav-item" to="/lessons">
          Lektionen
        </Link>
        <Link className="nav-item" to="/import">
          Import
        </Link>
        <Link className="nav-item" to="/vocab/new">
          Neue Vokabel
        </Link>
        <Link className="nav-item" to="/stats">
          Statistik
        </Link>
      </div>
    </div>
  )
}
