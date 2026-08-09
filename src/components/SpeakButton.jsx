import { SpeakerIcon } from './icons.jsx'

const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window

let voicesPromise = null

// Stimmen laden sich asynchron nach; ohne darauf zu warten, liefert getVoices() beim allerersten
// Aufruf oft ein leeres Array, wodurch keine koreanische Stimme gefunden und stattdessen die
// System-Standardstimme (meist Englisch/Deutsch) verwendet wird - das klingt komplett falsch.
function loadVoices() {
  if (voicesPromise) return voicesPromise
  voicesPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length > 0) {
      resolve(existing)
      return
    }
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices())
    }
    // Fallback, falls onvoiceschanged in manchen Browsern nie feuert.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000)
  })
  return voicesPromise
}

function pickKoreanVoice(voices) {
  const korean = voices.filter((voice) => voice.lang?.toLowerCase().startsWith('ko'))
  if (korean.length === 0) return null
  // Lokale (auf dem Gerät installierte) Stimmen bevorzugen, damit die Aussprache auch offline
  // funktioniert - passend zur Offline-Ausrichtung der App.
  return korean.find((voice) => voice.localService) ?? korean[0]
}

async function speak(text) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'

  const voices = await loadVoices()
  const koreanVoice = pickKoreanVoice(voices)
  if (koreanVoice) {
    utterance.voice = koreanVoice
  }

  window.speechSynthesis.speak(utterance)
}

export default function SpeakButton({ text }) {
  if (!supportsSpeech || !text) return null

  return (
    <button
      type="button"
      className="speak-btn"
      aria-label="Aussprache anhören"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        speak(text)
      }}
    >
      <SpeakerIcon />
    </button>
  )
}
