import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VERBS, CONJUGATION_FORM_LABELS } from '../data/verbs.js'
import SpeakButton from '../components/SpeakButton.jsx'

const SESSION_SIZE = 15
const FORM_KEYS = Object.keys(CONJUGATION_FORM_LABELS)

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildRound() {
  const combos = []
  for (const verb of VERBS) {
    for (const formKey of FORM_KEYS) {
      combos.push({ verb, formKey })
    }
  }
  return shuffle(combos).slice(0, SESSION_SIZE)
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, '')
}

export default function Conjugate() {
  const [phase, setPhase] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)

  function startRound() {
    setQuestions(buildRound())
    setCurrentIndex(0)
    setCorrectCount(0)
    setFeedback(null)
    setTypedAnswer('')
    setPhase('running')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (feedback) return
    const question = questions[currentIndex]
    const correctAnswer = question.verb.forms[question.formKey]
    const isCorrect = normalize(typedAnswer) === normalize(correctAnswer)
    setFeedback({ correct: isCorrect, correctAnswer })
    if (isCorrect) setCorrectCount((count) => count + 1)
  }

  function handleNext() {
    const nextIndex = currentIndex + 1
    setFeedback(null)
    setTypedAnswer('')
    if (nextIndex >= questions.length) {
      setPhase('summary')
      return
    }
    setCurrentIndex(nextIndex)
  }

  if (phase === 'idle') {
    return (
      <div className="page section-test">
        <h1>Konjugation üben</h1>
        <p className="back-link">
          <Link to="/">Zurück zum Dashboard</Link>
        </p>
        <div className="summary">
          <p>
            {SESSION_SIZE} zufällige Verb-Form-Kombinationen aus {VERBS.length} Verben (regelmäßig
            und unregelmäßig: ㅂ-, ㄷ-, ㄹ-, 르- und ㅅ-Verben sowie 으-Ausfall). Reines Übungsdrill,
            kein Einfluss auf den Lernfortschritt.
          </p>
          <button type="button" className="btn btn-primary" onClick={startRound}>
            Üben starten
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'summary') {
    const percent = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="page section-test">
        <div className="summary">
          <h1>Runde abgeschlossen</h1>
          <p className="test-score">{percent}%</p>
          <p>
            {correctCount} / {questions.length} richtig
          </p>
          <p className="back-link">
            <Link to="/">Zurück zum Dashboard</Link>
          </p>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const correctAnswer = question.verb.forms[question.formKey]

  return (
    <div className="page section-test">
      <h1>Konjugation üben</h1>
      <p className="review-progress">
        Frage {currentIndex + 1} von {questions.length}
      </p>

      <div className="review-card">
        <div className="korean-row">
          <p className="korean">{question.verb.dictionary_form}</p>
          <SpeakButton text={question.verb.dictionary_form} />
        </div>
        <p className="romanization">
          {question.verb.romanization} – {question.verb.translation_de}
        </p>
        <p className="meta">{question.verb.irregularClass}</p>
        <p className="hint">{CONJUGATION_FORM_LABELS[question.formKey]}</p>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="answer">Konjugierte Form</label>
          <input
            id="answer"
            value={typedAnswer}
            onChange={(event) => setTypedAnswer(event.target.value)}
            disabled={Boolean(feedback)}
            autoComplete="off"
          />
        </div>
        {!feedback && (
          <button type="submit" className="btn btn-primary btn-block">
            Prüfen
          </button>
        )}
      </form>

      {feedback && (
        <div className={`feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
          <p>{feedback.correct ? 'Richtig!' : `Falsch – richtig wäre: ${feedback.correctAnswer}`}</p>
          <button type="button" className="btn btn-primary btn-block" onClick={handleNext}>
            Weiter
          </button>
        </div>
      )}
    </div>
  )
}
