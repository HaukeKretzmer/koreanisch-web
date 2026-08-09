import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import { getAllLessons } from '../data/lessons.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { EmptyBoxIcon } from '../components/icons.jsx'
import { SkeletonRows } from '../components/Skeleton.jsx'

export default function Cards() {
  const [vocab, setVocab] = useState(null)
  const [grammar, setGrammar] = useState(null)
  const [lessonTitles, setLessonTitles] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAllVocab(), getAllGrammar(), getAllLessons()])
      .then(([allVocab, allGrammar, lessons]) => {
        setVocab(allVocab)
        setGrammar(allGrammar)
        setLessonTitles(Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson.title])))
      })
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <p className="error-text" role="alert">{error}</p>
  }

  return (
    <div className="page">
      <h1>Alle Karten</h1>
      <p className="back-link">
        <Link to="/">Zurück zum Dashboard</Link>
      </p>

      {vocab === null || grammar === null ? (
        <SkeletonRows count={6} />
      ) : (
        <>
          <h2>Vokabeln ({vocab.length})</h2>
          {vocab.length === 0 ? (
            <div className="empty-state">
              <EmptyBoxIcon />
              <p>Noch keine Vokabeln vorhanden.</p>
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
                  {card.lessonId && lessonTitles[card.lessonId] && (
                    <span className="meta">{lessonTitles[card.lessonId]}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <h2>Grammatik ({grammar.length})</h2>
          {grammar.length === 0 ? (
            <div className="empty-state">
              <EmptyBoxIcon />
              <p>Noch keine Grammatikpunkte vorhanden.</p>
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
                  {card.lessonId && lessonTitles[card.lessonId] && (
                    <span className="meta">{lessonTitles[card.lessonId]}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
