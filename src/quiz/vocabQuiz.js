// Geteilte Quiz-Logik für Tagestest und Dauerlernen: Fragen aus Vokabelkarten bauen und
// Texteingabe-Antworten gegen die hinterlegte Übersetzung prüfen.

export function shuffle(array) {
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

export function buildVocabQuestion(card, pool) {
  const answer = card.translation_de
  const options = Math.random() < 0.5
    ? buildChoiceOptions(answer, pool, (c) => c.translation_de)
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
}

export function normalize(text) {
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

export function isTypedAnswerCorrect(typedAnswer, correctAnswer) {
  return getAcceptableAnswers(correctAnswer).has(normalize(typedAnswer))
}
