import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllLessons } from '../data/lessons.js'

export default function Lessons() {
  const [lessons, setLessons] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <p className="error-text" role="alert">{error}</p>
  }

  if (lessons === null) {
    return <p className="loading-text">Lade Lektionen…</p>
  }

  return (
    <div className="page">
      <h1>Lektionen</h1>
      <p className="back-link">
        <Link to="/">Zurück zum Dashboard</Link>
      </p>
      {lessons.length === 0 ? (
        <p>Noch keine Lektionen importiert.</p>
      ) : (
        <ul className="list">
          {lessons.map((lesson) => (
            <li className="list-item" key={lesson.id}>
              <Link to={`/lessons/${lesson.id}`}>{lesson.title}</Link>
              {(lesson.level || lesson.topic) && (
                <span className="meta">
                  {[lesson.level, lesson.topic].filter(Boolean).join(' · ')}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
