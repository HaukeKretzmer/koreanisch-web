import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import { getAllLessons } from '../data/lessons.js'
import { getDueCards } from '../data/dueCards.js'

function startOfDay(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

function startOfRollingWeek(date) {
  const start = startOfDay(date)
  start.setDate(start.getDate() - 6)
  return start
}

function toDate(timestamp) {
  return timestamp?.toDate ? timestamp.toDate() : null
}

function groupCount(cards, field) {
  const counts = {}
  for (const card of cards) {
    const key = card[field] || 'Ohne Zuordnung'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAllVocab(), getAllGrammar(), getAllLessons(), getDueCards()])
      .then(([vocab, grammar, lessons, due]) => {
        const cards = [...vocab, ...grammar]
        const now = new Date()
        const todayStart = startOfDay(now)
        const weekStart = startOfRollingWeek(now)

        const reviewedToday = cards.filter((card) => {
          const reviewedAt = toDate(card.lastReviewedAt)
          return reviewedAt && reviewedAt >= todayStart
        }).length
        const reviewedThisWeek = cards.filter((card) => {
          const reviewedAt = toDate(card.lastReviewedAt)
          return reviewedAt && reviewedAt >= weekStart
        }).length

        const lessonTitles = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.title]))
        const byLesson = groupCount(cards, 'lessonId')
        const byLevel = groupCount(cards, 'level')

        setStats({
          total: cards.length,
          due: due.length,
          reviewedToday,
          reviewedThisWeek,
          byLesson: Object.entries(byLesson).map(([lessonId, count]) => ({
            label: lessonId === 'Ohne Zuordnung' ? lessonId : (lessonTitles[lessonId] ?? lessonId),
            count,
          })),
          byLevel: Object.entries(byLevel).map(([level, count]) => ({ label: level, count })),
        })
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <p className="error-text" role="alert">{error}</p>
  }

  if (!stats) {
    return <p className="loading-text">Lade Statistik…</p>
  }

  return (
    <div className="page">
      <h1>Statistik</h1>
      <p className="back-link">
        <Link to="/">Zurück zum Dashboard</Link>
      </p>

      <div className="stats-row">
        <div className="stat">
          <strong>{stats.total}</strong>
          <span>Insgesamt</span>
        </div>
        <div className="stat">
          <strong>{stats.due}</strong>
          <span>Fällig heute</span>
        </div>
      </div>
      <div className="stats-row">
        <div className="stat">
          <strong>{stats.reviewedToday}</strong>
          <span>Heute wiederholt</span>
        </div>
        <div className="stat">
          <strong>{stats.reviewedThisWeek}</strong>
          <span>Diese Woche</span>
        </div>
      </div>

      <h2>Nach Lektion</h2>
      <ul className="list">
        {stats.byLesson.map(({ label, count }) => (
          <li className="list-item" key={label}>
            {label}: {count}
          </li>
        ))}
      </ul>

      <h2>Nach Level</h2>
      <ul className="list">
        {stats.byLevel.map(({ label, count }) => (
          <li className="list-item" key={label}>
            {label}: {count}
          </li>
        ))}
      </ul>
    </div>
  )
}
