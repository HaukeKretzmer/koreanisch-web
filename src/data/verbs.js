// Kuratiertes Referenzset unregelmäßiger und regelmäßiger Verben für den Konjugations-Drill.
// Bewusst statisch (kein Firestore) - feste grammatische Referenz, keine Nutzerinhalte.
export const VERBS = [
  { id: 'verb-gada', dictionary_form: '가다', romanization: 'gada', translation_de: 'gehen', irregularClass: 'regulär', forms: { present: '가요', past: '갔어요', future: '갈 거예요', modifier: '가는' } },
  { id: 'verb-oda', dictionary_form: '오다', romanization: 'oda', translation_de: 'kommen', irregularClass: 'regulär', forms: { present: '와요', past: '왔어요', future: '올 거예요', modifier: '오는' } },
  { id: 'verb-meokda', dictionary_form: '먹다', romanization: 'meokda', translation_de: 'essen', irregularClass: 'regulär', forms: { present: '먹어요', past: '먹었어요', future: '먹을 거예요', modifier: '먹는' } },
  { id: 'verb-masida', dictionary_form: '마시다', romanization: 'masida', translation_de: 'trinken', irregularClass: 'regulär', forms: { present: '마셔요', past: '마셨어요', future: '마실 거예요', modifier: '마시는' } },
  { id: 'verb-boda', dictionary_form: '보다', romanization: 'boda', translation_de: 'sehen', irregularClass: 'regulär', forms: { present: '봐요', past: '봤어요', future: '볼 거예요', modifier: '보는' } },
  { id: 'verb-ikda', dictionary_form: '읽다', romanization: 'ikda', translation_de: 'lesen', irregularClass: 'regulär', forms: { present: '읽어요', past: '읽었어요', future: '읽을 거예요', modifier: '읽는' } },
  { id: 'verb-mannada', dictionary_form: '만나다', romanization: 'mannada', translation_de: 'treffen', irregularClass: 'regulär', forms: { present: '만나요', past: '만났어요', future: '만날 거예요', modifier: '만나는' } },
  { id: 'verb-baeuda', dictionary_form: '배우다', romanization: 'baeuda', translation_de: 'lernen', irregularClass: 'regulär', forms: { present: '배워요', past: '배웠어요', future: '배울 거예요', modifier: '배우는' } },
  { id: 'verb-gongbuhada', dictionary_form: '공부하다', romanization: 'gongbuhada', translation_de: 'lernen, studieren', irregularClass: '하다-Verb', forms: { present: '공부해요', past: '공부했어요', future: '공부할 거예요', modifier: '공부하는' } },
  { id: 'verb-sada', dictionary_form: '사다', romanization: 'sada', translation_de: 'kaufen', irregularClass: 'regulär', forms: { present: '사요', past: '샀어요', future: '살 거예요', modifier: '사는' } },
  { id: 'verb-salda', dictionary_form: '살다', romanization: 'salda', translation_de: 'wohnen, leben', irregularClass: 'ㄹ-불규칙', forms: { present: '살아요', past: '살았어요', future: '살 거예요', modifier: '사는' } },
  { id: 'verb-dopda', dictionary_form: '돕다', romanization: 'dopda', translation_de: 'helfen', irregularClass: 'ㅂ-불규칙', forms: { present: '도와요', past: '도왔어요', future: '도울 거예요', modifier: '돕는' } },
  { id: 'verb-gupda', dictionary_form: '굽다', romanization: 'gupda', translation_de: 'grillen, backen', irregularClass: 'ㅂ-불규칙', forms: { present: '구워요', past: '구웠어요', future: '구울 거예요', modifier: '굽는' } },
  { id: 'verb-deutda', dictionary_form: '듣다', romanization: 'deutda', translation_de: 'hören', irregularClass: 'ㄷ-불규칙', forms: { present: '들어요', past: '들었어요', future: '들을 거예요', modifier: '듣는' } },
  { id: 'verb-geotda', dictionary_form: '걷다', romanization: 'geotda', translation_de: 'gehen, laufen', irregularClass: 'ㄷ-불규칙', forms: { present: '걸어요', past: '걸었어요', future: '걸을 거예요', modifier: '걷는' } },
  { id: 'verb-bureuda', dictionary_form: '부르다', romanization: 'bureuda', translation_de: 'rufen, singen', irregularClass: '르-불규칙', forms: { present: '불러요', past: '불렀어요', future: '부를 거예요', modifier: '부르는' } },
  { id: 'verb-sseuda', dictionary_form: '쓰다', romanization: 'sseuda', translation_de: 'schreiben', irregularClass: '으-탈락', forms: { present: '써요', past: '썼어요', future: '쓸 거예요', modifier: '쓰는' } },
  { id: 'verb-jitda', dictionary_form: '짓다', romanization: 'jitda', translation_de: 'bauen, machen (z.B. Essen)', irregularClass: 'ㅅ-불규칙', forms: { present: '지어요', past: '지었어요', future: '지을 거예요', modifier: '짓는' } },
]

export const CONJUGATION_FORM_LABELS = {
  present: 'Präsens (-아/어요)',
  past: 'Vergangenheit (-았/었어요)',
  future: 'Zukunft (-(으)ㄹ 거예요)',
  modifier: 'Verbform vor Nomen (-는)',
}
