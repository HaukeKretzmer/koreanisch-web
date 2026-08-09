import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDueCards } from '../data/dueCards.js'
import { updateSrsFields } from '../data/cards.js'
import { sm2Update } from '../srs/sm2.js'

const RATING_BUTTONS = [
  { label: 'Nochmal', quality: 0, className: 'rating-again' },
  { label: 'Schwer', quality: 3, className: 'rating-hard' },
  { label: 'Gut', quality: 4, className: 'rating-good' },
  { label: 'Leicht', quality: 5, className: 'rating-easy' },
]

function CardFront({ card, onReveal }) {
  const front = card.collection === 'grammar' ? card.pattern || card.title : card.korean

  return (
    <button type="button" className="review-card" onClick={onReveal}>
      <p className="korean">{front}</p>
      {card.collection === 'vocabulary' && card.romanization && (
        <p className="romanization">{card.romanization}</p>
      )}
      <p className="hint">(antippen zum Aufdecken)</p>
    </button>
  )
}

function CardBack({ card }) {
  if (card.collection === 'grammar') {
    return (
      <div className="review-back">
        <p className="translation">{card.explanation_de}</p>
        {(card.examples ?? []).map((example, index) => (
          <p className="example" key={index}>
            {example.korean} – {example.translation_de}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="review-back">
      <p className="translation">{card.translation_de}</p>
      {card.example_sentence_kr && <p className="example">{card.example_sentence_kr}</p>}
      {card.example_sentence_de && <p className="example">{card.example_sentence_de}</p>}
    </div>
  )
}

export default function Review() {
  const [cards, setCards] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    getDueCards()
      .then(setCards)
      .catch((err) => setError(err.message))
  }, [])

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
    return <p className="loading-text">Lade fällige Karten…</p>
  }

  if (cards.length === 0) {
    return (
      <div className="page">
        <div className="summary">
          <p>Keine fälligen Karten.</p>
          <p className="back-link">
            <Link to="/">Zurück zum Dashboard</Link>
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
            <Link to="/">Zurück zum Dashboard</Link>
          </p>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div className="page">
      <h1>Review</h1>
      <p className="review-progress">
        Karte {currentIndex + 1} von {cards.length}
      </p>
      {!revealed ? (
        <CardFront card={currentCard} onReveal={() => setRevealed(true)} />
      ) : (
        <>
          <CardBack card={currentCard} />
          <div className="rating-buttons">
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
        </>
      )}
    </div>
  )
}
