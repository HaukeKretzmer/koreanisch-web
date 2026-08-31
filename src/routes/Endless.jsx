import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab } from '../data/vocab.js'
import { saveTestResult } from '../data/testResults.js'
import { shuffle, buildVocabQuestion, isTypedAnswerCorrect } from '../quiz/vocabQuiz.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { SkeletonBlock } from '../components/Skeleton.jsx'

export default function Endless() {
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState('')
  const [allVocab, setAllVocab] = useState([])
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [results, setResults] = useState({ correct: 0, total: 0 })

  // Einmal pro Frage berechnet (nicht bei jedem Tastenanschlag neu), sonst würde sich Modus/
  // Multiple-Choice-Optionen mitten in der Frage durch den enthaltenen Zufall verändern.
  const question = useMemo(
    () => (queue.length > 0 ? buildVocabQuestion(queue[currentIndex], allVocab) : null),
    [queue, currentIndex, allVocab],
  )

  async function startPractice() {
    setPhase('loading')
    setError('')
    try {
      const vocab = await getAllVocab()
      if (vocab.length === 0) {
        setError('Noch keine Vokabeln vorhanden.')
        setPhase('idle')
        return
      }
      setAllVocab(vocab)
      setQueue(shuffle(vocab))
      setCurrentIndex(0)
      setResults({ correct: 0, total: 0 })
      setFeedback(null)
      setTypedAnswer('')
      setPhase('running')
    } catch (err) {
      setError(err.message)
      setPhase('idle')
    }
  }

  function grade(isCorrect, selected, answer) {
    setFeedback({ correct: isCorrect, correctAnswer: answer, selected })
    setResults((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))
  }

  function handleTypedSubmit(event) {
    event.preventDefault()
    if (feedback) return
    grade(isTypedAnswerCorrect(typedAnswer, question.answer), undefined, question.answer)
  }

  function handleChoiceClick(question, option) {
    if (feedback) return
    grade(option === question.answer, option, question.answer)
  }

  function handleNext() {
    setFeedback(null)
    setTypedAnswer('')
    const nextIndex = currentIndex + 1
    if (nextIndex >= queue.length) {
      setQueue(shuffle(allVocab))
      setCurrentIndex(0)
    } else {
      setCurrentIndex(nextIndex)
    }
  }

  async function handleFinish() {
    if (results.total > 0) {
      try {
        await saveTestResult(results)
      } catch (err) {
        setError(err.message)
      }
    }
    setPhase('summary')
  }

  if (phase === 'idle') {
    return (
      <div className="page section-test">
        <h1>Dauerlernen</h1>
        <p className="back-link">
          <Link to="/">Zurück zum Dashboard</Link>
        </p>
        <div className="summary">
          <p>
            Alle Vokabeln, immer wieder neu gemischt, ohne Ende – gemischt aus Texteingabe und
            Multiple-Choice, genau wie beim Tagestest. Läuft weiter bis du auf "Beenden" tippst;
            dein Ergebnis wird dann gespeichert, der SM-2-Lernfortschritt deiner Karten bleibt
            unverändert.
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={startPractice}>
            Dauerlernen starten
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'loading') {
    return (
      <div className="page section-test">
        <SkeletonBlock />
      </div>
    )
  }

  if (phase === 'summary') {
    const percent = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0
    return (
      <div className="page section-test">
        <div className="summary">
          <h1>Runde beendet</h1>
          <p className="test-score">{percent}%</p>
          <p>
            Vokabeln: {results.correct} / {results.total}
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <p className="back-link">
            <Link to="/">Zurück zum Dashboard</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page section-test">
      <h1>Dauerlernen</h1>
      <div className="direction-toggle">
        <p className="review-progress">
          Vokabel {results.total + 1} · {results.correct} richtig
        </p>
        <button type="button" className="btn btn-ghost" onClick={handleFinish}>
          Beenden
        </button>
      </div>

      <div>
        {question.instruction && <p className="test-instruction">{question.instruction}</p>}
        <div className="review-card">
          <div className="korean-row">
            <p className="korean">{question.prompt}</p>
            <SpeakButton text={question.prompt} />
          </div>
          {question.secondary && <p className="romanization">{question.secondary}</p>}
        </div>

        {question.mode === 'typed' ? (
          <form className="form" onSubmit={handleTypedSubmit}>
            <div className="field">
              <label htmlFor="answer">Antwort</label>
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
        ) : (
          <div className="choice-grid">
            {question.options.map((option) => {
              let optionClass = 'choice-option'
              if (feedback) {
                if (option === question.answer) optionClass += ' choice-correct'
                else if (option === feedback.selected) optionClass += ' choice-wrong'
              }
              return (
                <button
                  key={option}
                  type="button"
                  className={optionClass}
                  onClick={() => handleChoiceClick(question, option)}
                  disabled={Boolean(feedback)}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        {feedback && (
          <div className={`feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`}>
            <p>{feedback.correct ? 'Richtig!' : `Falsch – richtig wäre: ${feedback.correctAnswer}`}</p>
            <button type="button" className="btn btn-primary btn-block" onClick={handleNext}>
              Weiter
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
