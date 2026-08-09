import { SpeakerIcon } from './icons.jsx'

const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window

function speak(text) {
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
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
