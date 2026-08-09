import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import { getDueCards } from '../data/dueCards.js'
import { ReviewIcon, LessonsIcon, ImportIcon, PlusIcon, StatsIcon, TestIcon } from '../components/icons.jsx'

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
        <div className="brand">
          <span className="brand-mark">한</span>
          <h1>Dashboard</h1>
        </div>
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
          <span className="nav-icon">
            <ReviewIcon />
          </span>
          Review starten
        </Link>
        <Link className="nav-item" to="/test">
          <span className="nav-icon">
            <TestIcon />
          </span>
          Tagestest
        </Link>
        <Link className="nav-item" to="/lessons">
          <span className="nav-icon">
            <LessonsIcon />
          </span>
          Lektionen
        </Link>
        <Link className="nav-item" to="/import">
          <span className="nav-icon">
            <ImportIcon />
          </span>
          Import
        </Link>
        <Link className="nav-item" to="/vocab/new">
          <span className="nav-icon">
            <PlusIcon />
          </span>
          Neue Vokabel
        </Link>
        <Link className="nav-item" to="/stats">
          <span className="nav-icon">
            <StatsIcon />
          </span>
          Statistik
        </Link>
      </div>
    </div>
  )
}
