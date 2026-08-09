import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllVocab, upsertVocabContent } from '../data/vocab.js'
import { getAllGrammar, upsertGrammarContent } from '../data/grammar.js'
import { upsertLesson } from '../data/lessons.js'

function validate(data) {
  if (!data || typeof data !== 'object') {
    return 'Datei enthält kein gültiges JSON-Objekt.'
  }
  if (!data.lesson || typeof data.lesson !== 'object') {
    return 'Feld "lesson" fehlt oder ist ungültig.'
  }
  if (!data.lesson.id || !data.lesson.title) {
    return 'Lektion braucht mindestens "id" und "title".'
  }
  const vocabulary = data.vocabulary ?? []
  const grammar = data.grammar ?? []
  if (!Array.isArray(vocabulary) || !Array.isArray(grammar)) {
    return '"vocabulary" und "grammar" müssen Arrays sein.'
  }
  for (const item of vocabulary) {
    if (!item.id || !item.korean || !item.translation_de) {
      return 'Jede Vokabel braucht mindestens "id", "korean" und "translation_de".'
    }
  }
  for (const item of grammar) {
    if (!item.id || !item.explanation_de) {
      return 'Jeder Grammatikpunkt braucht mindestens "id" und "explanation_de".'
    }
  }
  return ''
}

export default function Import() {
  const [data, setData] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    setData(null)
    setPreview(null)
    setDone(false)

    let parsed
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setError('Datei ist kein gültiges JSON.')
      return
    }

    const validationError = validate(parsed)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const [existingVocab, existingGrammar] = await Promise.all([getAllVocab(), getAllGrammar()])
      const existingVocabIds = new Set(existingVocab.map((card) => card.id))
      const existingGrammarIds = new Set(existingGrammar.map((card) => card.id))
      const vocabulary = parsed.vocabulary ?? []
      const grammar = parsed.grammar ?? []

      setData(parsed)
      setPreview({
        newVocab: vocabulary.filter((item) => !existingVocabIds.has(item.id)).length,
        updatedVocab: vocabulary.filter((item) => existingVocabIds.has(item.id)).length,
        newGrammar: grammar.filter((item) => !existingGrammarIds.has(item.id)).length,
        updatedGrammar: grammar.filter((item) => existingGrammarIds.has(item.id)).length,
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleImport() {
    setImporting(true)
    setError('')
    try {
      const { lesson, vocabulary = [], grammar = [] } = data
      const { id: lessonId, ...lessonContent } = lesson
      await upsertLesson(lessonId, lessonContent)

      for (const item of vocabulary) {
        const { id, ...content } = item
        await upsertVocabContent(id, { ...content, lessonId })
      }
      for (const item of grammar) {
        const { id, ...content } = item
        await upsertGrammarContent(id, { ...content, lessonId })
      }

      setDone(true)
      setData(null)
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

      {preview && data && (
        <div>
          <h2>Vorschau: {data.lesson.title}</h2>
          <p>Vokabeln: {preview.newVocab} neu, {preview.updatedVocab} aktualisiert</p>
          <p>Grammatik: {preview.newGrammar} neu, {preview.updatedGrammar} aktualisiert</p>
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
