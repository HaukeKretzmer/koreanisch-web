import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab } from '../data/vocab.js'
import { saveTestResult } from '../data/testResults.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const VOCAB_TARGET = 20

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function buildChoiceOptions(correctAnswer, pool, getValue) {
  const distractors = shuffle([
    ...new Set(pool.map(getValue).filter((value) => value && value !== correctAnswer)),
  ]).slice(0, 3)
  if (distractors.length < 3) return null
  return shuffle([correctAnswer, ...distractors])
}

function buildQuestions(vocabCards) {
  return shuffle(vocabCards)
    .slice(0, VOCAB_TARGET)
    .map((card) => {
      const answer = card.translation_de
      const options = Math.random() < 0.5
        ? buildChoiceOptions(answer, vocabCards, (c) => c.translation_de)
        : null
      return {
        card,
        mode: options ? 'choice' : 'typed',
        instruction: 'Wie heißt das auf Deutsch?',
        prompt: card.korean,
        secondary: card.romanization,
        answer,
        options,
      }
    })
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Übersetzungen in den Inhalten nutzen verschiedene Notationen für "mehrere gültige Antworten"
// bzw. optionale Zusätze:
//  - Komma außerhalb von Klammern:      "Haus, Zuhause"              -> zwei Alternativen
//  - " / " (mit Leerzeichen):           "Morgen / Frühstück"         -> zwei Alternativen
//  - Klammer mit Leerzeichen davor:     "drei (Sino-koreanisch)"     -> Klammerteil ist optional
//  - Klammer direkt am Wort:            "Angestellte(r)"             -> Klammerinhalt verschmilzt
//  - Komma INNERHALB einer Klammer:     "Bulgogi (gegrilltes, mariniertes Rindfleisch)"
//                                       -> kein Trenner, gehört zum Text
// splitTopLevel trennt nur an einem Zeichen außerhalb von Klammern, damit der letzte Fall nicht
// fälschlich aufgespalten wird.
function splitTopLevel(text, separator) {
  const parts = []
  let depth = 0
  let current = ''
  for (const char of text) {
    if (char === '(') depth += 1
    if (char === ')') depth -= 1
    if (char === separator && depth <= 0) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts
}

function expandAnswerVariants(text) {
  const variants = new Set([text])
  // Erklärende Klammer mit Leerzeichen davor: ganz weglassen ("drei (Sino-koreanisch)" -> "drei")
  variants.add(text.replace(/\s+\([^)]*\)/g, ''))
  // Klammer direkt am Wort: nur die Klammerzeichen entfernen ("Angestellte(r)" -> "Angestellter")
  variants.add(text.replace(/\(([^)]*)\)/g, '$1'))
  // Schrägstrich direkt am Wort (Geschlechtsform): verschmelzen oder weglassen
  if (/\S\/\S/.test(text)) {
    variants.add(text.replace(/\/(\S+)/g, '$1'))
    variants.add(text.replace(/\/\S+/g, ''))
  }
  return [...variants].map((variant) => variant.trim()).filter(Boolean)
}

function getAcceptableAnswers(correctAnswer) {
  const parts = splitTopLevel(correctAnswer, ',').flatMap((part) =>
    part.includes(' / ') ? part.split(' / ') : [part],
  )
  const variants = parts.flatMap(expandAnswerVariants)
  return new Set(variants.map(normalize))
}

function isTypedAnswerCorrect(typedAnswer, correctAnswer) {
  return getAcceptableAnswers(correctAnswer).has(normalize(typedAnswer))
}

export default function Test() {
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [results, setResults] = useState({ correct: 0, total: 0 })

  async function startTest() {
    setPhase('loading')
    setError('')
    try {
      const vocab = await getAllVocab()
      const vocabQuestions = buildQuestions(vocab)
      setQuestions(vocabQuestions)
      setCurrentIndex(0)
      setResults({ correct: 0, total: vocabQuestions.length })
      setFeedback(null)
      setTypedAnswer('')
      setPhase(vocabQuestions.length > 0 ? 'running' : 'summary')
    } catch (err) {
      setError(err.message)
      setPhase('idle')
    }
  }

  function grade(isCorrect, selected) {
    const question = questions[currentIndex]
    setFeedback({ correct: isCorrect, correctAnswer: question.answer, selected })
    if (isCorrect) {
      setResults((prev) => ({ ...prev, correct: prev.correct + 1 }))
    }
  }

  function handleTypedSubmit(event) {
    event.preventDefault()
    if (feedback) return
    const question = questions[currentIndex]
    grade(isTypedAnswerCorrect(typedAnswer, question.answer))
  }

  function handleChoiceClick(option) {
    if (feedback) return
    const question = questions[currentIndex]
    grade(option === question.answer, option)
  }

  async function handleNext() {
    const nextIndex = currentIndex + 1
    setFeedback(null)
    setTypedAnswer('')
    if (nextIndex >= questions.length) {
      try {
        await saveTestResult(results)
      } catch (err) {
        setError(err.message)
      }
      setPhase('summary')
      return
    }
    setCurrentIndex(nextIndex)
  }

  if (phase === 'idle') {
    return (
      <div className="page section-test">
        <h1>Tagestest</h1>
        <p className="back-link">
          <Link to="/">Zurück zum Dashboard</Link>
        </p>
        <div className="summary">
          <p>
            Bis zu {VOCAB_TARGET} Vokabeln, gemischt aus Texteingabe und Multiple-Choice. Reines
            Übungsquiz – dein Ergebnis wird gespeichert, aber der SM-2-Lernfortschritt deiner
            Karten bleibt unverändert.
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="btn btn-primary" onClick={startTest}>
            Test starten
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
          <h1>Test abgeschlossen</h1>
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

  const question = questions[currentIndex]

  return (
    <div className="page section-test">
      <h1>Tagestest</h1>
      <p className="review-progress">
        Vokabel {currentIndex + 1} von {results.total}
      </p>

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
                  onClick={() => handleChoiceClick(option)}
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
