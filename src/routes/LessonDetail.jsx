import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLesson } from '../data/lessons.js'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'

export default function LessonDetail() {
  const { id } = useParams()
  const [lesson, setLesson] = useState(null)
  const [vocab, setVocab] = useState([])
  const [grammar, setGrammar] = useState([])
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
    Promise.all([getLesson(id), getAllVocab(), getAllGrammar()])
      .then(([lessonResult, allVocab, allGrammar]) => {
        setLesson(lessonResult)
        setVocab(allVocab.filter((card) => card.lessonId === id))
        setGrammar(allGrammar.filter((card) => card.lessonId === id))
        setLoaded(true)
      })
      .catch((err) => setError(err.message))
  }, [id])

  if (error) {
    return <p className="error-text" role="alert">{error}</p>
  }

  if (!loaded) {
    return <p className="loading-text">Lade Lektion…</p>
  }

  if (!lesson) {
    return (
      <div className="page">
        <p>Lektion nicht gefunden.</p>
        <p className="back-link">
          <Link to="/lessons">Zurück zur Lektionsübersicht</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>{lesson.title}</h1>
      <p className="back-link">
        <Link to="/lessons">Zurück zur Lektionsübersicht</Link>
      </p>
      {lesson.description && <p>{lesson.description}</p>}
      {(lesson.level || lesson.topic) && (
        <p className="meta">{[lesson.level, lesson.topic].filter(Boolean).join(' · ')}</p>
      )}

      <h2>Vokabeln ({vocab.length})</h2>
      {vocab.length === 0 ? (
        <p>Keine Vokabeln in dieser Lektion.</p>
      ) : (
        <ul className="list">
          {vocab.map((card) => (
            <li className="list-item" key={card.id}>
              <Link className="edit-link" to={`/vocab/${card.id}/edit`}>
                Bearbeiten
              </Link>
              {card.korean}
              {card.romanization && <> ({card.romanization})</>} – {card.translation_de}
            </li>
          ))}
        </ul>
      )}

      <h2>Grammatik ({grammar.length})</h2>
      {grammar.length === 0 ? (
        <p>Keine Grammatikpunkte in dieser Lektion.</p>
      ) : (
        <ul className="list">
          {grammar.map((card) => (
            <li className="list-item" key={card.id}>
              {card.pattern || card.title} – {card.explanation_de}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
