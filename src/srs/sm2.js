// Reine SM-2-Planungsfunktion, keine Firebase-Abhängigkeit.
// quality: 0 = Nochmal, 3 = Schwer, 4 = Gut, 5 = Leicht (Anki-Stil)
export function sm2Update(card, quality, now = new Date()) {
  let { repetitions, easeFactor, intervalDays } = card

  if (quality < 3) {
    repetitions = 0
    intervalDays = 1
  } else {
    repetitions += 1
    if (repetitions === 1) intervalDays = 1
    else if (repetitions === 2) intervalDays = 6
    else intervalDays = Math.round(intervalDays * easeFactor)
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  )

  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + intervalDays)

  return { repetitions, easeFactor, intervalDays, dueDate, lastReviewedAt: now }
}
