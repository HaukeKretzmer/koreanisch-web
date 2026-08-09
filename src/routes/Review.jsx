import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getDueCards } from '../data/dueCards.js'
import { getLessonCards } from '../data/lessonCards.js'
import { getLesson } from '../data/lessons.js'
import { updateSrsFields } from '../data/cards.js'
import { sm2Update } from '../srs/sm2.js'
import SpeakButton from '../components/SpeakButton.jsx'
import { EmptyCheckIcon, EmptyBoxIcon } from '../components/icons.jsx'
import { SkeletonBlock } from '../components/Skeleton.jsx'

const RATING_BUTTONS = [
  { label: 'Nochmal', quality: 0, className: 'rating-again' },
  { label: 'Schwer', quality: 3, className: 'rating-hard' },
  { label: 'Gut', quality: 4, className: 'rating-good' },
  { label: 'Leicht', quality: 5, className: 'rating-easy' },
]

function koreanOf(card) {
  return card.collection === 'grammar' ? card.pattern || card.title : card.korean
}

function germanOf(card) {
  return card.collection === 'grammar' ? card.explanation_de : card.translation_de
}

function CardFrontContent({ card, isProduction }) {
  const front = isProduction ? germanOf(card) : koreanOf(card)

  return (
    <>
      {isProduction ? (
        <p className="korean">{front}</p>
      ) : (
        <div className="korean-row">
          <p className="korean">{front}</p>
          <SpeakButton text={front} />
        </div>
      )}
      {!isProduction && card.collection === 'vocabulary' && card.romanization && (
        <p className="romanization">{card.romanization}</p>
      )}
      <p className="hint">(antippen zum Aufdecken)</p>
    </>
  )
}

function CardBackContent({ card, isProduction }) {
  const isGrammar = card.collection === 'grammar'
  const koreanText = koreanOf(card)
  const germanText = germanOf(card)
  const examples = isGrammar ? card.examples ?? [] : []

  return (
    <>
      {isProduction ? (
        <div className="korean-row">
          <p className="translation">{koreanText}</p>
          <SpeakButton text={koreanText} />
        </div>
      ) : (
        <p className="translation">{germanText}</p>
      )}
      {!isProduction && !isGrammar && card.romanization && (
        <p className="romanization">{card.romanization}</p>
      )}

      {isGrammar
        ? examples.map((example, index) => (
            <p className="example" key={index}>
              {example.korean} – {example.translation_de}
              <SpeakButton text={example.korean} />
            </p>
          ))
        : (card.example_sentence_kr || card.example_sentence_de) && (
            <p className="example">
              {card.example_sentence_kr}
              {card.example_sentence_kr && <SpeakButton text={card.example_sentence_kr} />}
              {card.example_sentence_kr && card.example_sentence_de && ' – '}
              {card.example_sentence_de}
            </p>
          )}
    </>
  )
}

export default function Review() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const isProduction = searchParams.get('direction') === 'production'
  const backLink = lessonId ? `/lessons/${lessonId}` : '/'
  const backLabel = lessonId ? 'Zurück zur Lektion' : 'Zurück zum Dashboard'

  const [cards, setCards] = useState(null)
  const [lessonTitle, setLessonTitle] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (lessonId) {
      Promise.all([getLessonCards(lessonId), getLesson(lessonId)])
        .then(([lessonCards, lesson]) => {
          setCards(lessonCards)
          setLessonTitle(lesson?.title ?? null)
        })
        .catch((err) => setError(err.message))
    } else {
      getDueCards()
        .then(setCards)
        .catch((err) => setError(err.message))
    }
  }, [lessonId])

  function reveal() {
    if (revealed) return
    setRevealed(true)
  }

  async function handleRate(quality) {
    const currentCard = cards[currentIndex]
    const updatedSrs = sm2Update(currentCard, quality)
    try {
      await updateSrsFields(currentCard.collection, currentCard.id, updatedSrs)
      setReviewedCount((count) => count + 1)
      setCurrentIndex((index) => index + 1)
      setRevealed(false)
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) {
    return <p className="error-text" role="alert">{error}</p>
  }

  if (cards === null) {
    return (
      <div className="page">
        <SkeletonBlock />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          {lessonId ? <EmptyBoxIcon /> : <EmptyCheckIcon />}
          <p>{lessonId ? 'Diese Lektion hat noch keine Karten.' : 'Keine fälligen Karten.'}</p>
          <p className="back-link">
            <Link to={backLink}>{backLabel}</Link>
          </p>
        </div>
      </div>
    )
  }

  if (currentIndex >= cards.length) {
    return (
      <div className="page">
        <div className="summary">
          <h1>Runde abgeschlossen</h1>
          <p>Du hast {reviewedCount} Karte{reviewedCount === 1 ? '' : 'n'} wiederholt.</p>
          <p className="back-link">
            <Link to={backLink}>{backLabel}</Link>
          </p>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  const heading = lessonId ? `Review: ${lessonTitle ?? ''}` : 'Review'
  const cardAccentStyle =
    currentCard.collection === 'grammar'
      ? { '--accent': 'var(--accent-grammar)', '--accent-2': 'var(--accent-grammar-2)' }
      : undefined

  return (
    <div className="page">
      <h1>
        {heading}
        {isProduction ? ' (Produktion)' : ''}
      </h1>
      <p className="review-progress">
        Karte {currentIndex + 1} von {cards.length}
      </p>

      <div className="flip-container" style={cardAccentStyle}>
        <div className={`flip-inner${revealed ? ' flipped' : ''}`}>
          <div
            className="review-card flip-front"
            role="button"
            tabIndex={0}
            onClick={reveal}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                reveal()
              }
            }}
          >
            <CardFrontContent card={currentCard} isProduction={isProduction} />
          </div>
          <div className="review-back flip-back">
            <CardBackContent card={currentCard} isProduction={isProduction} />
          </div>
        </div>
      </div>

      {revealed && (
        <div className="rating-buttons" style={cardAccentStyle}>
          {RATING_BUTTONS.map(({ label, quality, className }) => (
            <button
              key={label}
              type="button"
              className={`btn ${className}`}
              onClick={() => handleRate(quality)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
