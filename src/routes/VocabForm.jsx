import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAllLessons } from '../data/lessons.js'
import { getVocab, upsertVocabContent } from '../data/vocab.js'

const EMPTY_FORM = {
  korean: '',
  romanization: '',
  translation_de: '',
  part_of_speech: '',
  example_sentence_kr: '',
  example_sentence_de: '',
  tags: '',
  level: '',
  lessonId: '',
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function VocabForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllLessons()
      .then(setLessons)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!isEdit) return
    getVocab(id)
      .then((card) => {
        if (!card) {
          setError('Vokabel nicht gefunden.')
          return
        }
        setForm({
          korean: card.korean ?? '',
          romanization: card.romanization ?? '',
          translation_de: card.translation_de ?? '',
          part_of_speech: card.part_of_speech ?? '',
          example_sentence_kr: card.example_sentence_kr ?? '',
          example_sentence_de: card.example_sentence_de ?? '',
          tags: (card.tags ?? []).join(', '),
          level: card.level ?? '',
          lessonId: card.lessonId ?? '',
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.korean.trim() || !form.translation_de.trim()) {
      setError('"Koreanisch" und "Übersetzung" sind Pflichtfelder.')
      return
    }

    const content = {
      korean: form.korean.trim(),
      romanization: form.romanization.trim(),
      translation_de: form.translation_de.trim(),
      part_of_speech: form.part_of_speech.trim(),
      example_sentence_kr: form.example_sentence_kr.trim(),
      example_sentence_de: form.example_sentence_de.trim(),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      level: form.level.trim(),
      lessonId: form.lessonId || null,
    }

    const vocabId = isEdit
      ? id
      : `vocab-${slugify(form.romanization || form.korean)}-${Date.now().toString(36)}`

    setSaving(true)
    try {
      await upsertVocabContent(vocabId, content)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="loading-text">Lade Vokabel…</p>
  }

  return (
    <div className="page">
      <h1>{isEdit ? 'Vokabel bearbeiten' : 'Neue Vokabel'}</h1>
      <p className="back-link">
        <Link to="/lessons">Zurück zu den Lektionen</Link>
      </p>
      <form className="form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="korean">Koreanisch</label>
          <input id="korean" value={form.korean} onChange={updateField('korean')} required />
        </div>
        <div className="field">
          <label htmlFor="romanization">Romanisierung</label>
          <input id="romanization" value={form.romanization} onChange={updateField('romanization')} />
        </div>
        <div className="field">
          <label htmlFor="translation_de">Übersetzung (Deutsch)</label>
          <input
            id="translation_de"
            value={form.translation_de}
            onChange={updateField('translation_de')}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="part_of_speech">Wortart</label>
          <input id="part_of_speech" value={form.part_of_speech} onChange={updateField('part_of_speech')} />
        </div>
        <div className="field">
          <label htmlFor="example_sentence_kr">Beispielsatz (Koreanisch)</label>
          <input
            id="example_sentence_kr"
            value={form.example_sentence_kr}
            onChange={updateField('example_sentence_kr')}
          />
        </div>
        <div className="field">
          <label htmlFor="example_sentence_de">Beispielsatz (Deutsch)</label>
          <input
            id="example_sentence_de"
            value={form.example_sentence_de}
            onChange={updateField('example_sentence_de')}
          />
        </div>
        <div className="field">
          <label htmlFor="tags">Tags (kommagetrennt)</label>
          <input id="tags" value={form.tags} onChange={updateField('tags')} />
        </div>
        <div className="field">
          <label htmlFor="level">Level</label>
          <input id="level" value={form.level} onChange={updateField('level')} />
        </div>
        <div className="field">
          <label htmlFor="lessonId">Lektion</label>
          <select id="lessonId" value={form.lessonId} onChange={updateField('lessonId')}>
            <option value="">– keine –</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </form>
    </div>
  )
}
