import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getLesson } from '../data/lessons.js'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { EmptyBoxIcon } from '../components/icons.jsx'
import { SkeletonRows, SkeletonBlock } from '../components/Skeleton.jsx'

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
    return (
      <div className="page">
        <SkeletonBlock height={32} />
        <div style={{ marginTop: 16 }}>
          <SkeletonRows count={4} />
        </div>
      </div>
    )
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
        <span className="badge-row">
          {lesson.level && <span className="badge">{lesson.level}</span>}
          {lesson.topic && <span className="badge">{lesson.topic}</span>}
        </span>
      )}

      {vocab.length + grammar.length > 0 && (
        <div className="direction-toggle">
          <Link className="btn btn-primary" to={`/review/lesson/${lesson.id}`}>
            Diese Lektion lernen
          </Link>
          <Link className="btn btn-ghost" to={`/review/lesson/${lesson.id}?direction=production`}>
            Produktion üben
          </Link>
        </div>
      )}

      <h2>Vokabeln ({vocab.length})</h2>
      {vocab.length === 0 ? (
        <div className="empty-state">
          <EmptyBoxIcon />
          <p>Keine Vokabeln in dieser Lektion.</p>
        </div>
      ) : (
        <ul className="list">
          {vocab.map((card) => (
            <li className="list-item" key={card.id}>
              <Link className="edit-link" to={`/vocab/${card.id}/edit`}>
                Bearbeiten
              </Link>
              <span className="word-row">
                {card.korean}
                <SpeakButton text={card.korean} />
              </span>
              {card.romanization && <> ({card.romanization})</>} – {card.translation_de}
            </li>
          ))}
        </ul>
      )}

      <h2>Grammatik ({grammar.length})</h2>
      {grammar.length === 0 ? (
        <div className="empty-state">
          <EmptyBoxIcon />
          <p>Keine Grammatikpunkte in dieser Lektion.</p>
        </div>
      ) : (
        <ul className="list">
          {grammar.map((card) => (
            <li className="list-item" key={card.id}>
              <span className="word-row">
                {card.pattern || card.title}
                <SpeakButton text={card.pattern || card.title} />
              </span>{' '}
              – {card.explanation_de}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
