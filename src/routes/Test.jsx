import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab } from '../data/vocab.js'
import { getAllGrammar } from '../data/grammar.js'
import { saveTestResult } from '../data/testResults.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const VOCAB_TARGET = 20
const GRAMMAR_TARGET = 10

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

function buildGrammarQuestion(card, grammarCards, allClozeAnswers) {
  const clozeOptions = Array.isArray(card.cloze) ? card.cloze : []
  const useCloze = clozeOptions.length > 0 && Math.random() < 0.5

  if (useCloze) {
    const clozeItem = clozeOptions[Math.floor(Math.random() * clozeOptions.length)]
    const options = Math.random() < 0.5
      ? buildChoiceOptions(clozeItem.answer, allClozeAnswers, (value) => value)
      : null
    return {
      collection: 'grammar',
      card,
      kind: 'cloze',
      mode: options ? 'choice' : 'typed',
      prompt: clozeItem.sentence,
      secondary: clozeItem.translation_de,
      answer: clozeItem.answer,
      options,
    }
  }

  const answer = card.pattern || card.title
  const options = Math.random() < 0.5
    ? buildChoiceOptions(answer, grammarCards, (c) => c.pattern || c.title)
    : null
  return {
    collection: 'grammar',
    card,
    kind: 'pattern',
    mode: options ? 'choice' : 'typed',
    prompt: card.explanation_de,
    secondary: null,
    answer,
    options,
  }
}

function buildQuestions(vocabCards, grammarCards) {
  const vocabQuestions = shuffle(vocabCards)
    .slice(0, VOCAB_TARGET)
    .map((card) => {
      const answer = card.translation_de
      const options = Math.random() < 0.5
        ? buildChoiceOptions(answer, vocabCards, (c) => c.translation_de)
        : null
      return {
        collection: 'vocabulary',
        card,
        mode: options ? 'choice' : 'typed',
        prompt: card.korean,
        secondary: card.romanization,
        answer,
        options,
      }
    })

  const allClozeAnswers = grammarCards.flatMap((card) =>
    Array.isArray(card.cloze) ? card.cloze.map((item) => item.answer) : [],
  )
  const grammarQuestions = shuffle(grammarCards)
    .slice(0, GRAMMAR_TARGET)
    .map((card) => buildGrammarQuestion(card, grammarCards, allClozeAnswers))

  return { vocabQuestions, grammarQuestions }
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Manche Übersetzungen listen mehrere gültige Alternativen kommagetrennt auf (z.B. "Haus,
// Zuhause") - jede davon soll als richtige Antwort zählen, nicht nur der volle String.
function isTypedAnswerCorrect(typedAnswer, correctAnswer) {
  const alternatives = correctAnswer.split(',').map(normalize)
  return alternatives.includes(normalize(typedAnswer))
}

function ClozeSentence({ sentence }) {
  const [before, after] = sentence.split('___')
  return (
    <p className="korean">
      {before}
      <span className="cloze-blank">___</span>
      {after}
    </p>
  )
}

export default function Test() {
  const [phase, setPhase] = useState('idle')
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [results, setResults] = useState({ vocabCorrect: 0, vocabTotal: 0, grammarCorrect: 0, grammarTotal: 0 })

  async function startTest() {
    setPhase('loading')
    setError('')
    try {
      const [vocab, grammar] = await Promise.all([getAllVocab(), getAllGrammar()])
      const { vocabQuestions, grammarQuestions } = buildQuestions(vocab, grammar)
      setQuestions([...vocabQuestions, ...grammarQuestions])
      setCurrentIndex(0)
      setResults({
        vocabCorrect: 0,
        vocabTotal: vocabQuestions.length,
        grammarCorrect: 0,
        grammarTotal: grammarQuestions.length,
      })
      setFeedback(null)
      setTypedAnswer('')
      setPhase(vocabQuestions.length + grammarQuestions.length > 0 ? 'running' : 'summary')
    } catch (err) {
      setError(err.message)
      setPhase('idle')
    }
  }

  function grade(isCorrect, selected) {
    const question = questions[currentIndex]
    setFeedback({ correct: isCorrect, correctAnswer: question.answer, selected })

    setResults((prev) => {
      const key = question.collection === 'vocabulary' ? 'vocabCorrect' : 'grammarCorrect'
      return isCorrect ? { ...prev, [key]: prev[key] + 1 } : prev
    })
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
            Bis zu {VOCAB_TARGET} Vokabeln und {GRAMMAR_TARGET} Sätze (Grammatikpunkte), gemischt aus
            Texteingabe und Multiple-Choice. Reines Übungsquiz – dein Ergebnis wird gespeichert, aber
            der SM-2-Lernfortschritt deiner Karten bleibt unverändert.
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
    const totalCorrect = results.vocabCorrect + results.grammarCorrect
    const total = results.vocabTotal + results.grammarTotal
    const percent = total > 0 ? Math.round((totalCorrect / total) * 100) : 0
    return (
      <div className="page section-test">
        <div className="summary">
          <h1>Test abgeschlossen</h1>
          <p className="test-score">{percent}%</p>
          <p>
            Vokabeln: {results.vocabCorrect} / {results.vocabTotal}
          </p>
          <p>
            Sätze: {results.grammarCorrect} / {results.grammarTotal}
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
  const sectionLabel = question.collection === 'vocabulary' ? 'Vokabel' : 'Satz'
  const sectionIndex =
    question.collection === 'vocabulary' ? currentIndex + 1 : currentIndex + 1 - results.vocabTotal
  const sectionTotal = question.collection === 'vocabulary' ? results.vocabTotal : results.grammarTotal
  const cardAccentStyle =
    question.collection === 'grammar'
      ? { '--accent': 'var(--accent-grammar)', '--accent-2': 'var(--accent-grammar-2)' }
      : undefined

  return (
    <div className="page section-test">
      <h1>Tagestest</h1>
      <p className="review-progress">
        {sectionLabel} {sectionIndex} von {sectionTotal}
      </p>

      <div style={cardAccentStyle}>
        <div className="review-card">
          {question.collection === 'vocabulary' ? (
            <div className="korean-row">
              <p className="korean">{question.prompt}</p>
              <SpeakButton text={question.prompt} />
            </div>
          ) : question.kind === 'cloze' ? (
            <ClozeSentence sentence={question.prompt} />
          ) : (
            <p className="korean">{question.prompt}</p>
          )}
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
