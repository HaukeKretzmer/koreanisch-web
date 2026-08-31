import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab, VOCAB_COLLECTION } from '../data/vocab.js'
import { bulkUpsertContentPreservingSrs } from '../data/cards.js'
import { getAllLessons, bulkUpsertLessons } from '../data/lessons.js'

function validateLessonEntry(entry, label) {
  if (!entry || typeof entry !== 'object') {
    return `${label}: kein gültiges Objekt.`
  }
  if (!entry.lesson || typeof entry.lesson !== 'object') {
    return `${label}: Feld "lesson" fehlt oder ist ungültig.`
  }
  if (!entry.lesson.id || !entry.lesson.title) {
    return `${label}: Lektion braucht mindestens "id" und "title".`
  }
  const vocabulary = entry.vocabulary ?? []
  if (!Array.isArray(vocabulary)) {
    return `${label}: "vocabulary" muss ein Array sein.`
  }
  for (const item of vocabulary) {
    if (!item.id || !item.korean || !item.translation_de) {
      return `${label}: Jede Vokabel braucht mindestens "id", "korean" und "translation_de".`
    }
  }
  return ''
}

// Unterstützt zwei Formate: eine einzelne Lektion ({ lesson, vocabulary }) oder mehrere
// Lektionen in einer Datei ({ lessons: [{ lesson, vocabulary }, ...] }).
function normalize(data) {
  if (!data || typeof data !== 'object') {
    return { error: 'Datei enthält kein gültiges JSON-Objekt.', lessons: [] }
  }
  if (Array.isArray(data.lessons)) {
    for (const [index, entry] of data.lessons.entries()) {
      const error = validateLessonEntry(entry, `Lektion ${index + 1}`)
      if (error) return { error, lessons: [] }
    }
    return { error: '', lessons: data.lessons }
  }
  const error = validateLessonEntry(data, 'Lektion')
  if (error) return { error, lessons: [] }
  return { error: '', lessons: [data] }
}

export default function Import() {
  const [parsedData, setParsedData] = useState(null)
  const [preview, setPreview] = useState(null)
  const [skipExistingVocab, setSkipExistingVocab] = useState(false)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setParsedData(null)
    setPreview(null)
    setSkipExistingVocab(false)
    setDone(false)

    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setError('Datei ist kein gültiges JSON.')
      return
    }

    const { error: validationError, lessons: parsedLessons } = normalize(parsed)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const [existingVocab, existingLessons] = await Promise.all([getAllVocab(), getAllLessons()])
      const existingVocabIds = new Set(existingVocab.map((card) => card.id))
      const existingLessonIds = new Set(existingLessons.map((lesson) => lesson.id))
      const allVocab = parsedLessons.flatMap((entry) => entry.vocabulary ?? [])

      setParsedData({ entries: parsedLessons, existingVocabIds, existingLessonIds })
      setPreview({
        title: parsedLessons.length === 1 ? parsedLessons[0].lesson.title : null,
        lessonCount: parsedLessons.length,
        newVocab: allVocab.filter((item) => !existingVocabIds.has(item.id)).length,
        updatedVocab: allVocab.filter((item) => existingVocabIds.has(item.id)).length,
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleImport() {
    setImporting(true)
    setError('')
    try {
      const { entries, existingVocabIds, existingLessonIds } = parsedData
      const lessonPayloads = entries.map((entry) => ({ id: entry.lesson.id, ...entry.lesson }))
      let vocabPayloads = entries.flatMap((entry) =>
        (entry.vocabulary ?? []).map((item) => ({ ...item, lessonId: entry.lesson.id })),
      )
      if (skipExistingVocab) {
        vocabPayloads = vocabPayloads.filter((item) => !existingVocabIds.has(item.id))
      }

      await bulkUpsertLessons(lessonPayloads, existingLessonIds)
      await bulkUpsertContentPreservingSrs(VOCAB_COLLECTION, vocabPayloads, existingVocabIds)

      setDone(true)
      setParsedData(null)
      setPreview(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="page">
      <h1>Import</h1>
      <p className="back-link">
        <Link to="/">Zurück zum Dashboard</Link>
      </p>

      <input type="file" accept="application/json,.json" onChange={handleFileChange} />

      {error && <p className="error-text" role="alert">{error}</p>}

      {preview && parsedData && (
        <div>
          <h2>Vorschau: {preview.title ?? `${preview.lessonCount} Lektionen`}</h2>
          <p>
            Vokabeln: {preview.newVocab} neu
            {preview.updatedVocab > 0 &&
              (skipExistingVocab
                ? `, ${preview.updatedVocab} übersprungen (bereits vorhanden)`
                : `, ${preview.updatedVocab} aktualisiert`)}
          </p>
          {preview.updatedVocab > 0 && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
              <input
                type="checkbox"
                checked={skipExistingVocab}
                onChange={(event) => setSkipExistingVocab(event.target.checked)}
              />
              Bestehende Vokabeln nicht aktualisieren, nur neue hinzufügen
            </label>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={handleImport} disabled={importing}>
            {importing ? 'Importiere…' : 'Importieren'}
          </button>
        </div>
      )}

      {done && (
        <div>
          <p>Import abgeschlossen.</p>
          <p className="back-link">
            <Link to="/lessons">Zu den Lektionen</Link>
          </p>
        </div>
      )}
    </div>
  )
}
