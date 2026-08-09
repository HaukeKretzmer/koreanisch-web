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
    return <p role="alert">{error}</p>
  }

  if (!loaded) {
    return <p>Lade Lektion…</p>
  }

  if (!lesson) {
    return (
      <div>
        <p>Lektion nicht gefunden.</p>
        <Link to="/lessons">Zurück zur Lektionsübersicht</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>{lesson.title}</h1>
      <p>
        <Link to="/lessons">Zurück zur Lektionsübersicht</Link>
      </p>
      {lesson.description && <p>{lesson.description}</p>}
      {lesson.level && <p>Level: {lesson.level}</p>}
      {lesson.topic && <p>Thema: {lesson.topic}</p>}

      <h2>Vokabeln ({vocab.length})</h2>
      {vocab.length === 0 ? (
        <p>Keine Vokabeln in dieser Lektion.</p>
      ) : (
        <ul>
          {vocab.map((card) => (
            <li key={card.id}>
              {card.korean}
              {card.romanization && <> ({card.romanization})</>} – {card.translation_de}{' '}
              <Link to={`/vocab/${card.id}/edit`}>Bearbeiten</Link>
            </li>
          ))}
        </ul>
      )}

      <h2>Grammatik ({grammar.length})</h2>
      {grammar.length === 0 ? (
        <p>Keine Grammatikpunkte in dieser Lektion.</p>
      ) : (
        <ul>
          {grammar.map((card) => (
            <li key={card.id}>
              {card.pattern || card.title} – {card.explanation_de}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
