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
    return <p role="alert">{error}</p>
  }

  if (lessons === null) {
    return <p>Lade Lektionen…</p>
  }

  return (
    <div>
      <h1>Lektionen</h1>
      <p>
        <Link to="/">Zurück zum Dashboard</Link>
      </p>
      {lessons.length === 0 ? (
        <p>Noch keine Lektionen importiert.</p>
      ) : (
        <ul>
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link to={`/lessons/${lesson.id}`}>{lesson.title}</Link>
              {lesson.level && <> – {lesson.level}</>}
              {lesson.topic && <> – {lesson.topic}</>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
