import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab } from '../data/vocab.js'
import { getAllLessons } from '../data/lessons.js'
import { getDueCards } from '../data/dueCards.js'
import { getRecentTestResults } from '../data/testResults.js'
import { EmptyBoxIcon } from '../components/icons.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'

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

function BarChart({ rows }) {
  const max = Math.max(1, ...rows.map((row) => row.count))
  return (
    <div className="bar-chart">
      {rows.map(({ label, count }) => (
        <div className="bar-row" key={label}>
          <div className="bar-row-label">
            <span>{label}</span>
            <span>{count}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function scoreBarClass(percent) {
  if (percent < 50) return 'bar-fill-low'
  if (percent < 80) return 'bar-fill-mid'
  return 'bar-fill-high'
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const [testHistory, setTestHistory] = useState(null)

  useEffect(() => {
    getRecentTestResults(5)
      .then(setTestHistory)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    Promise.all([getAllVocab(), getAllLessons(), getDueCards()])
      .then(([vocab, lessons, due]) => {
        const now = new Date()
        const todayStart = startOfDay(now)
        const weekStart = startOfRollingWeek(now)

        const reviewedToday = vocab.filter((card) => {
          const reviewedAt = toDate(card.lastReviewedAt)
          return reviewedAt && reviewedAt >= todayStart
        }).length
        const reviewedThisWeek = vocab.filter((card) => {
          const reviewedAt = toDate(card.lastReviewedAt)
          return reviewedAt && reviewedAt >= weekStart
        }).length

        const lessonTitles = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.title]))
        const byLesson = groupCount(vocab, 'lessonId')
        const byLevel = groupCount(vocab, 'level')

        setStats({
          total: vocab.length,
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
    return (
      <div className="page section-stats">
        <h1>Statistik</h1>
        <div className="stats-row">
          <div className="skeleton" style={{ flex: 1, height: 74, borderRadius: 14 }} />
          <div className="skeleton" style={{ flex: 1, height: 74, borderRadius: 14 }} />
        </div>
        <SkeletonRows count={3} />
      </div>
    )
  }

  return (
    <div className="page section-stats">
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
      <BarChart rows={stats.byLesson} />

      <h2>Nach Level</h2>
      <BarChart rows={stats.byLevel} />

      <h2>Testverlauf</h2>
      {!testHistory ? (
        <SkeletonRows count={2} height={40} />
      ) : testHistory.length === 0 ? (
        <div className="empty-state">
          <EmptyBoxIcon />
          <p>Noch kein Tagestest abgeschlossen.</p>
        </div>
      ) : (
        <div className="bar-chart">
          {testHistory.map((result) => {
            const percent = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0
            const date = result.createdAt?.toDate ? result.createdAt.toDate() : null
            return (
              <div className="bar-row" key={result.id}>
                <div className="bar-row-label">
                  <span>{date ? date.toLocaleDateString('de-DE') : '–'}</span>
                  <span>{percent}%</span>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${scoreBarClass(percent)}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
