import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllLessons } from '../data/lessons.js'
import { EmptyBoxIcon } from '../components/icons.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'

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

  return (
    <div className="page">
      <h1>Lektionen</h1>
      <p className="back-link">
        <Link to="/">Zurück zum Dashboard</Link>
      </p>
      {lessons === null ? (
        <SkeletonRows count={4} />
      ) : lessons.length === 0 ? (
        <div className="empty-state">
          <EmptyBoxIcon />
          <p>Noch keine Lektionen importiert.</p>
        </div>
      ) : (
        <ul className="list">
          {lessons.map((lesson) => (
            <li className="list-item" key={lesson.id}>
              <Link to={`/lessons/${lesson.id}`}>{lesson.title}</Link>
              {(lesson.level || lesson.topic) && (
                <span className="badge-row">
                  {lesson.level && <span className="badge">{lesson.level}</span>}
                  {lesson.topic && <span className="badge">{lesson.topic}</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
