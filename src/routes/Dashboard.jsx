import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { getAllVocab, deleteAllVocab } from '../data/vocab.js'
import { getDueCards } from '../data/dueCards.js'
import {
  ReviewIcon,
  LessonsIcon,
  ImportIcon,
  PlusIcon,
  StatsIcon,
  TestIcon,
  SwapIcon,
  InfinityIcon,
} from '../components/icons.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  function loadCounts() {
    Promise.all([getAllVocab(), getDueCards()])
      .then(([vocab, due]) => {
        setCounts({ total: vocab.length, due: due.length })
      })
      .catch((err) => setError(err.message))
  }

  useEffect(() => {
    loadCounts()
  }, [])

  async function handleDeleteAllVocab() {
    if (!window.confirm('Wirklich alle Vokabeln unwiderruflich löschen?')) return
    setDeleting(true)
    setError('')
    try {
      await deleteAllVocab()
      setCounts(null)
      loadCounts()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

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
      {!counts && !error && (
        <div className="stats-row">
          <div className="skeleton" style={{ flex: 1, height: 74, borderRadius: 14 }} />
          <div className="skeleton" style={{ flex: 1, height: 74, borderRadius: 14 }} />
        </div>
      )}
      {counts && (
        <div className="stats-row">
          <div className="stat">
            <strong>{counts.due}</strong>
            <span>Fällig heute</span>
          </div>
          <Link className="stat stat-link" to="/cards">
            <strong>{counts.total}</strong>
            <span>Vokabeln insgesamt</span>
          </Link>
        </div>
      )}

      <div className="nav-list">
        <Link className="nav-item" to="/review">
          <span className="nav-icon">
            <ReviewIcon />
          </span>
          Review starten
        </Link>
        <Link className="nav-item" to="/review?direction=production">
          <span className="nav-icon">
            <SwapIcon />
          </span>
          Produktion üben (Deutsch → Koreanisch)
        </Link>
        <Link className="nav-item" to="/test">
          <span className="nav-icon">
            <TestIcon />
          </span>
          Tagestest
        </Link>
        <Link className="nav-item" to="/endless">
          <span className="nav-icon">
            <InfinityIcon />
          </span>
          Dauerlernen
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

      <div style={{ marginTop: 32 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={handleDeleteAllVocab}
          disabled={deleting}
        >
          {deleting ? 'Lösche…' : 'Alle Vokabeln löschen'}
        </button>
      </div>
    </div>
  )
}
