import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDueCards } from '../data/dueCards.js'
import { updateSrsFields } from '../data/cards.js'
import { sm2Update } from '../srs/sm2.js'

const RATING_BUTTONS = [
  { label: 'Nochmal', quality: 0 },
  { label: 'Schwer', quality: 3 },
  { label: 'Gut', quality: 4 },
  { label: 'Leicht', quality: 5 },
]

function CardFront({ card, onReveal }) {
  const front = card.collection === 'grammar' ? card.pattern || card.title : card.korean

  return (
    <button type="button" onClick={onReveal}>
      <p>{front}</p>
      {card.collection === 'vocabulary' && card.romanization && <p>{card.romanization}</p>}
      <p>(antippen zum Aufdecken)</p>
    </button>
  )
}

function CardBack({ card }) {
  if (card.collection === 'grammar') {
    return (
      <div>
        <p>{card.explanation_de}</p>
        {(card.examples ?? []).map((example, index) => (
          <p key={index}>
            {example.korean} – {example.translation_de}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div>
      <p>{card.translation_de}</p>
      {card.example_sentence_kr && <p>{card.example_sentence_kr}</p>}
      {card.example_sentence_de && <p>{card.example_sentence_de}</p>}
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
    return <p role="alert">{error}</p>
  }

  if (cards === null) {
    return <p>Lade fällige Karten…</p>
  }

  if (cards.length === 0) {
    return (
      <div>
        <p>Keine fälligen Karten.</p>
        <Link to="/">Zurück zum Dashboard</Link>
      </div>
    )
  }

  if (currentIndex >= cards.length) {
    return (
      <div>
        <h1>Runde abgeschlossen</h1>
        <p>Du hast {reviewedCount} Karte{reviewedCount === 1 ? '' : 'n'} wiederholt.</p>
        <Link to="/">Zurück zum Dashboard</Link>
      </div>
    )
  }

  const currentCard = cards[currentIndex]

  return (
    <div>
      <h1>Review</h1>
      <p>
        Karte {currentIndex + 1} von {cards.length}
      </p>
      {!revealed ? (
        <CardFront card={currentCard} onReveal={() => setRevealed(true)} />
      ) : (
        <>
          <CardBack card={currentCard} />
          <div>
            {RATING_BUTTONS.map(({ label, quality }) => (
              <button key={label} type="button" onClick={() => handleRate(quality)}>
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
