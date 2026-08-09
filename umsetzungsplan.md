# Koreanisch-Lern-PWA: Umsetzungsplan

## Kontext

Der Nutzer möchte Koreanisch lernen und braucht dafür ein mobil nutzbares Tool mit
einem Karteikarten-System (Spaced Repetition) für Vokabeln sowie Grammatik. Lektionsinhalte
sollen extern mit Claude erstellt und dann in die App importiert werden, statt live per
API generiert zu werden. Das Arbeitsverzeichnis (`Lerntool`) ist ein reines Dokumentenablage-
Verzeichnis (Uni-Unterlagen für Chemie/Physik/Bio) ohne bestehenden Code für dieses Projekt –
es handelt sich um ein Greenfield-Projekt. Einziges relevantes Vorbild ist
[toxikologie_quiz.html](toxikologie_quiz.html): ein eigenständiges, serverloses HTML-Quiz-Tool
im Dark-Theme, das zeigt, dass der Nutzer mit einfachen, unaufwendigen Frontend-Lösungen gut
zurechtkommt (aber keine Persistenz über Sitzungen hinweg bietet).

Alle Produktanforderungen wurden in einer ausführlichen Rückfrage-Runde geklärt (siehe Chat-
Verlauf): Single-User, iPhone/PWA, Offline-fähig, deutsche UI, SM-2 Spaced Repetition,
JSON-Datei-Import mit stabilen IDs (damit Re-Importe den Lernfortschritt nicht zurücksetzen),
Firebase/Firestore für Datenhaltung + Offline-Sync (bewusst gegenüber reinem
Browser-`localStorage` gewählt, um später auch von einem anderen Gerät auf den Fortschritt
zugreifen zu können), Hosting auf Vercel mit kostenloser Standard-Domain.

Ziel dieses Plans: ein konkretes, von einem Solo-Entwickler (mit KI-Unterstützung) umsetzbares
MVP definieren – ohne Overengineering (kein CI/CD, keine Testsuite, kein Admin-Bereich über das
Nötige hinaus).

## Architekturentscheidung

**Vite + React (JavaScript, kein TypeScript) + react-router-dom + vite-plugin-pwa + Firebase
JS SDK v10.**

- **Kein Next.js**: Es gibt keinen Server-Rendering-Bedarf; Firestore/Auth werden direkt aus
  dem Browser angesprochen. Next.js' Client/Server-Component-Grenze erzeugt nur unnötige
  Reibung mit clientseitigen SDKs wie Firebase, ohne Vorteil für diese Single-User-App.
- **React statt purem Vanilla-JS** (wie im Referenz-File): Das Quiz-Tool verwaltet einen
  einzigen State (aktuelle Frage). Diese App hat ~7 Screens, eine Firestore-gebundene
  Karten-Queue, mehrere Formulare und Auth-State – React hält das wartbarer als
  handgeschriebene DOM-Manipulation, bleibt aber im Geiste der "einfachen, schlanken
  Lösung" des Vorbilds.
- **Plain JavaScript statt TypeScript**: passend zum unaufwendigen Stil des Referenz-Tools;
  kein zusätzlicher Tooling-Layer für ein Solo-Hobby-Projekt dieser Größe.
- **Vite** liefert ein statisches `dist/`-Build, das Vercel ohne Konfiguration erkennt.
  **vite-plugin-pwa** (Workbox-basiert) generiert Manifest + Service Worker deklarativ.

## Firebase/Firestore-Datenmodell & Zugriffsschutz

**Auth**: Firebase Auth mit genau einem fest angelegten E-Mail/Passwort-Account (manuell in
der Firebase Console erstellt, keine In-App-Registrierung). Ein reiner Passcode wäre hier
*keine* echte Vereinfachung: Firestore Security Rules können nur `request.auth` prüfen, ein
App-seitiger Passcode wäre im JS-Bundle auslesbar und würde die Rules faktisch offenlegen.

**Collections** (unter der User-ID genestet, für triviale Security Rules):

```
users/{uid}/lessons/{lessonId}
  title, level, topic, description, created_at, importedAt

users/{uid}/vocabulary/{vocabId}        // Dok-ID = vocab.id aus dem JSON (stabil)
  // Inhaltsfelder (werden bei Re-Import überschrieben)
  korean, romanization, translation_de, part_of_speech,
  example_sentence_kr, example_sentence_de, tags, level, lessonId
  // SRS-Felder (werden vom Import NIE angefasst)
  repetitions, easeFactor, intervalDays, dueDate, lastReviewedAt, createdAt, updatedAt

users/{uid}/grammar/{grammarId}         // Dok-ID = grammar.id aus dem JSON
  // gleiche Struktur: Inhaltsfelder + identische SRS-Felder
  // (Grammatikpunkte werden mit derselben SM-2-Logik wie Vokabeln abgefragt)
```

Security Rule:
```
match /users/{uid}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

**Re-Import-Logik (wichtig für Korrektheit)**: Beim Import wird pro Vokabel/Grammatikpunkt nur
mit `setDoc(ref, contentFields, { merge: true })` geschrieben – SRS-Felder
(`repetitions`, `easeFactor`, `intervalDays`, `dueDate`, `lastReviewedAt`) sind davon explizit
ausgenommen. Existiert das Dokument noch nicht, werden zusätzlich die SRS-Startwerte gesetzt
(`repetitions: 0, easeFactor: 2.5, intervalDays: 0, dueDate: heute`). So setzt ein erneuter
Import derselben/aktualisierten Lektion nie den Lernfortschritt zurück.

## SM-2-Algorithmus

Pro Karte gespeichert: `repetitions`, `easeFactor` (Start 2.5, Untergrenze 1.3), `intervalDays`,
`dueDate`, `lastReviewedAt`, `createdAt`/`updatedAt`.

Bewertungs-Buttons (Anki-Stil): **Nochmal**=0, **Schwer**=3, **Gut**=4, **Leicht**=5.

Reine, Firebase-unabhängige Funktion in `src/srs/sm2.js` (isoliert testbar):

```js
export function sm2Update(card, quality, now = new Date()) {
  let { repetitions, easeFactor, intervalDays } = card;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + intervalDays);

  return { repetitions, easeFactor, intervalDays, dueDate, lastReviewedAt: now };
}
```

Der Review-Screen ruft `sm2Update(currentCard, quality)` beim Button-Klick auf, schreibt das
Ergebnis über die Data-Access-Schicht ins passende Firestore-Dokument und geht zur nächsten
Karte in der lokalen Queue über.

## JSON-Import-Format (bereits mit dem Nutzer festgelegt)

```json
{
  "lesson": {
    "id": "lesson-alltag-einkaufen-01",
    "title": "Alltag: Beim Einkaufen",
    "level": "TOPIK1",
    "topic": "Einkaufen",
    "description": "Grundwortschatz und Redewendungen zum Einkaufen",
    "created_at": "2026-08-09"
  },
  "vocabulary": [
    {
      "id": "vocab-gagyeok",
      "korean": "가격",
      "romanization": "gagyeok",
      "translation_de": "Preis",
      "part_of_speech": "Nomen",
      "example_sentence_kr": "이 가격은 너무 비싸요.",
      "example_sentence_de": "Dieser Preis ist zu teuer.",
      "tags": ["Einkaufen", "Alltag"],
      "level": "TOPIK1"
    }
  ],
  "grammar": [
    {
      "id": "grammar-eul-kkayo",
      "title": "-(으)ㄹ까요? – Vorschlag/Frage",
      "pattern": "V-(으)ㄹ까요?",
      "explanation_de": "Höflicher Vorschlag oder Frage nach der Meinung des Gegenübers.",
      "examples": [{ "korean": "같이 갈까요?", "translation_de": "Sollen wir zusammen gehen?" }],
      "level": "TOPIK1",
      "tags": ["Fragen", "Vorschläge"]
    }
  ]
}
```

IDs: sprechend, kleingeschrieben, mit Bindestrich (`vocab-<romanisierung>`,
`grammar-<kurzbeschreibung>`).

## PWA-Setup

- `vite-plugin-pwa` mit `registerType: 'autoUpdate'` generiert Manifest + Service Worker.
- Manifest: deutsche Namen, `display: 'standalone'`, Dark-Theme-Farben passend zum
  Referenz-File (`#0f1620` Hintergrund, `#4f8ff0` Akzent), Icons 192×192/512×512 + maskable.
- Service Worker cacht nur den App-Shell (JS/CSS/HTML/Icons). **Kein** Runtime-Caching für
  `firestore.googleapis.com` – Firestores eigene Offline-Persistenz (IndexedDB-basiert)
  übernimmt das Daten-Caching, doppeltes Caching würde nur Stale-Data-Risiken schaffen.
- Firestore-Offline-Persistenz aktivieren: `initializeFirestore(app, { localCache:
  persistentLocalCache({ tabManager: persistentSingleTabManager() }) })`.
- iOS-spezifisch: `apple-touch-icon` (180×180), `apple-mobile-web-app-capable`-Meta-Tags,
  `viewport-fit=cover`. Kein automatischer Install-Prompt auf iOS – "Teilen → Zum
  Home-Bildschirm" bleibt ein manueller Schritt für den Nutzer.

## Screens (MVP)

- `/login` – E-Mail/Passwort-Anmeldung (einziger fester Account)
- `/` – Dashboard: fällige Karten heute, Gesamtzahl, Shortcuts zu Review/Lektionen/Import/Neu
- `/review` – Karteikarten-Queue (Vokabeln + Grammatik gemischt), Vorderseite → Aufdecken →
  4 Bewertungs-Buttons, Zusammenfassung am Ende
- `/lessons` und `/lessons/:id` – Lektionsübersicht und Detailansicht
- `/import` – JSON-Upload, Validierung, Vorschau (neu vs. aktualisiert), merge-sicherer Import
- `/vocab/new`, `/vocab/:id/edit` – manuelles Anlegen/Bearbeiten (nur Inhaltsfelder, SRS-Felder
  bleiben unangetastet)
- `/stats` – Gesamtkarten, fällig heute, heute/diese Woche wiederholt, Aufschlüsselung nach
  Lektion/Level

Ein `ProtectedRoute`-Wrapper um alle Routen außer `/login` leitet nicht angemeldete Nutzer um.

## Kritische Dateien

- `src/firebase.js` – Firebase App/Auth/Firestore-Init mit aktivierter Offline-Persistenz
- `src/srs/sm2.js` – reine SM-2-Planungsfunktion, der algorithmische Kern
- `src/data/vocab.js`, `grammar.js`, `lessons.js` – Firestore-Data-Access-Schicht inkl.
  merge-sicherem Upsert, der SRS-Felder bei Re-Import erhält
- `src/routes/Import.jsx` – JSON-Import-Screen mit der stabilen-ID-Merge-Logik
- `vite.config.js` – vite-plugin-pwa-Konfiguration (Manifest, Precache-Scope, Ausschluss von
  Firestore aus dem Service-Worker-Runtime-Caching)

## Umsetzungsschritte für die KI

Die folgenden Schritte sind so formuliert, dass du sie **einzeln, nacheinander** als Prompt an
eine KI (z.B. Claude Code) im Projektverzeichnis geben kannst. Jeder Schritt ist in sich
abgeschlossen, baut auf den vorherigen Schritten auf und enthält ein Kriterium, an dem du
prüfen kannst, ob er erfolgreich war, bevor du zum nächsten übergehst. Manche Schritte (2, 3,
11, 13) enthalten manuelle Aktionen für dich außerhalb der KI (Firebase-/Vercel-Konsole,
Gerätetest) – die KI kann dir dabei die genauen Klicks/Werte nennen, aber die Ausführung dort
liegt bei dir.

---

**Schritt 1 – Projekt-Grundgerüst + Deploy-Skelett**
> Lege in diesem Verzeichnis ein neues Vite-Projekt mit React (JavaScript, kein TypeScript) an.
> Installiere `firebase`, `react-router-dom` und `vite-plugin-pwa`. Richte eine minimale
> Grundstruktur ein (leere Startseite reicht) und ein `.gitignore` inkl. `.env.local`. Richte
> ein Git-Repository ein und committe den Stand. Erkläre mir danach kurz, wie ich das Projekt
> lokal starte.
- **Kriterium**: `npm run dev` zeigt eine leere/Platzhalter-Seite im Browser.

**Schritt 2 – Firebase-Projekt anlegen (manuell, mit Anleitung)**
> Gib mir eine Schritt-für-Schritt-Anleitung, wie ich in der Firebase Console ein neues Projekt
> anlege, Firestore (Produktionsmodus, EU-Region) und Authentication mit E-Mail/Passwort
> aktiviere, dort meinen einen Nutzer-Account manuell anlege und die Web-App-Config-Werte
> (apiKey, authDomain, projectId, etc.) finde.
- **Kriterium**: Du hast ein Firebase-Projekt mit aktivierter Firestore-DB, aktiviertem
  E-Mail/Passwort-Login und einem angelegten Account; die Config-Werte liegen dir vor.

**Schritt 3 – Firebase-Init im Code**
> Lege `src/firebase.js` an, das die App mit den Firebase-Config-Werten aus
> Umgebungsvariablen (`VITE_FIREBASE_*`) initialisiert, Firestore mit aktivierter
> Offline-Persistenz (`persistentLocalCache` + `persistentSingleTabManager`) einrichtet und
> `auth`/`db` exportiert. Lege eine `.env.local` mit Platzhalter-Variablennamen an (echte Werte
> trage ich selbst ein) und dokumentiere die benötigten Variablennamen kurz in einer README.
- **Kriterium**: Die App startet ohne Fehler, sobald die echten Firebase-Werte in `.env.local`
  eingetragen sind (keine Konsolen-Fehler zu Firebase-Init).

**Schritt 4 – Auth-Flow**
> Baue einen `/login`-Screen mit E-Mail/Passwort-Anmeldung über Firebase Auth, einen
> `ProtectedRoute`-Wrapper, der nicht angemeldete Nutzer zu `/login` umleitet, und eine
> Logout-Funktion. Richte `react-router-dom` mit den Routen `/login` und `/` (Platzhalter,
> geschützt) ein.
- **Kriterium**: Ohne Login landet man auf `/login`; nach Login mit dem in Schritt 2 angelegten
  Account gelangt man auf `/`; nach Logout wieder auf `/login`. Session übersteht ein
  Neuladen der Seite.

**Schritt 5 – Firestore-Datenmodell & Data-Access-Schicht**
> Lege unter `src/data/` die Module `vocab.js`, `grammar.js` und `lessons.js` an, die auf die
> Collections `users/{uid}/vocabulary`, `users/{uid}/grammar`, `users/{uid}/lessons`
> zugreifen (Struktur wie im Abschnitt "Firestore-Datenmodell" dieses Plans beschrieben).
> Implementiere: `getAllVocab()`, `getAllGrammar()`, `getDueCards(now)` (vocab+grammar
> zusammengeführt, `dueDate <= now`), `updateSrsFields(collection, id, srsFields)` und
> `upsertContentPreservingSrs(collection, id, contentFields)` (merge-Write, der SRS-Felder nie
> überschreibt, siehe Re-Import-Logik im Plan). Veröffentliche außerdem die Firestore Security
> Rules aus dem Plan und gib mir die Anleitung, sie in der Firebase Console einzutragen.
- **Kriterium**: Über die Firebase Console manuell ein Test-Vokabel-Dokument anlegen; die
  Funktionen liefern in einem kurzen Test-Skript/einer Konsolenausgabe die erwarteten Daten
  zurück.

**Schritt 6 – SM-2-Modul**
> Implementiere `src/srs/sm2.js` exakt nach der im Plan angegebenen Formel als reine Funktion
> `sm2Update(card, quality, now)` ohne Firebase-Abhängigkeit. Schreibe dazu ein paar einfache
> Beispielaufrufe (z.B. als Kommentar oder kleines Test-Skript), die zeigen, dass
> `intervalDays`/`easeFactor`/`repetitions` sich bei quality 0 vs. 3 vs. 5 wie erwartet
> verhalten.
- **Kriterium**: Bei quality < 3 wird `repetitions` auf 0 zurückgesetzt und `intervalDays` auf
  1; bei wiederholt hoher quality wächst `intervalDays`; `easeFactor` fällt nie unter 1.3.

**Schritt 7 – Review-Screen**
> Baue den `/review`-Screen: lädt fällige Karten über `getDueCards()`, zeigt die Vorderseite
> (Koreanisch), per Klick/Tap wird die Rückseite (Übersetzung, Beispielsatz) aufgedeckt, danach
> vier Bewertungs-Buttons (Nochmal/Schwer/Gut/Leicht). Bei Klick wird `sm2Update` aufgerufen,
> das Ergebnis per `updateSrsFields` gespeichert, und die nächste Karte in der lokalen Queue
> angezeigt. Am Ende der Queue eine kurze Zusammenfassung (Anzahl wiederholter Karten).
- **Kriterium**: Mit den Test-Daten aus Schritt 5 lässt sich eine komplette Review-Runde
  durchspielen; Werte in Firestore aktualisieren sich sichtbar. Danach: Netzwerk in den
  Browser-Devtools deaktivieren und bestätigen, dass die Review-Runde weiterhin funktioniert
  (Firestore-Offline-Cache).

**Schritt 8 – Lektionsliste & Detailansicht**
> Baue `/lessons` (Liste aller importierten Lektionen) und `/lessons/:id` (zeigt die
> zugehörigen Vokabeln und Grammatikpunkte dieser Lektion).
- **Kriterium**: Die Test-Lektion aus Schritt 5 erscheint in der Liste und die Detailseite
  zeigt die zugehörigen Karten korrekt an.

**Schritt 9 – Import-Screen**
> Baue `/import`: Datei-Upload für eine JSON-Datei im im Plan definierten Format, Validierung
> der Struktur, Anzeige einer Vorschau (wie viele Vokabeln/Grammatikpunkte sind neu, wie viele
> aktualisieren bestehende Karten), und nutzt beim Bestätigen
> `upsertContentPreservingSrs()` aus Schritt 5 für den eigentlichen Import.
- **Kriterium**: Die Beispieldatei aus dem Plan importieren → Karten erscheinen in
  `/lessons` und `/review`. Eine Karte in `/review` bewerten, danach dieselbe Datei erneut
  importieren → `repetitions`/`easeFactor`/`dueDate` dieser Karte bleiben unverändert, nur
  Inhaltsfelder werden aktualisiert.

**Schritt 10 – Manuelles Vokabel-Formular**
> Baue `/vocab/new` und `/vocab/:id/edit` als gemeinsame Formular-Komponente zum manuellen
> Anlegen/Bearbeiten einzelner Vokabeln (nur Inhaltsfelder; SRS-Felder werden beim Bearbeiten
> nicht verändert, bei Neuanlage mit den SRS-Startwerten initialisiert).
- **Kriterium**: Eine neue Vokabel manuell anlegen → erscheint in `/review`, sobald sie fällig
  ist; eine bestehende bearbeiten → Änderungen erscheinen, SRS-Fortschritt bleibt erhalten.

**Schritt 11 – Stats/Dashboard-Screen**
> Baue `/` als Dashboard (fällige Karten heute, Gesamtzahl Karten, Shortcuts zu
> Review/Lektionen/Import/Neu) und `/stats` (heute/diese Woche wiederholt, Aufschlüsselung
> nach Lektion/Level) mit einfachen Firestore-Zählabfragen.
- **Kriterium**: Zahlen auf dem Dashboard stimmen mit dem Testdatenstand überein.

**Schritt 12 – PWA-Konfiguration**
> Richte `vite-plugin-pwa` in `vite.config.js` ein (Manifest mit deutschem Namen,
> `display: 'standalone'`, Dark-Theme-Farben `#0f1620`/`#4f8ff0`, Icons 192×192/512×512 +
> maskable, App-Shell-Precaching ohne Runtime-Caching für `firestore.googleapis.com`) sowie
> die iOS-Meta-Tags (`apple-touch-icon`, `apple-mobile-web-app-capable`,
> `viewport-fit=cover`). Generiere/platzhalter-Icons, falls noch keine vorhanden sind.
- **Kriterium**: `npm run build && npm run preview` liefert ein installierbares PWA-Manifest
  (in Chrome-Devtools unter "Application" prüfbar).

**Schritt 13 – Deploy auf Vercel (mit Anleitung) + Gerätetest**
> Gib mir eine Anleitung, wie ich das Projekt bei Vercel verbinde (GitHub-Repo oder CLI), die
> `VITE_FIREBASE_*`-Umgebungsvariablen im Vercel-Dashboard setze und die entstehende
> `*.vercel.app`-Domain zu Firebase Auths "Authorized Domains" hinzufüge.
- **Kriterium**: App unter der Vercel-URL erreichbar, Login funktioniert. Auf dem iPhone in
  Safari öffnen, "Teilen" → "Zum Home-Bildschirm", über das Icon starten, kompletten
  Review-Durchlauf im Flugmodus testen.

**Schritt 14 – Visueller Feinschliff**
> Vereinheitliche das Erscheinungsbild aller Screens im Dark-Theme-Stil von
> `toxikologie_quiz.html` (gleiche CSS-Variablen-Palette), prüfe, dass alle Texte auf Deutsch
> sind, und poliere mobile Bedienbarkeit (Touch-Ziele, Abstände) auf dem iPhone-Bildschirm.
- **Kriterium**: Durchgängiger visueller Eindruck über alle Screens, gut bedienbar auf dem
  iPhone.

## Deployment

**Firebase:**
1. Projekt in der Firebase Console anlegen, Web-App registrieren für die Config-Werte.
2. Firestore aktivieren (Produktionsmodus, EU-Region z.B. `eur3`).
3. Authentication → E-Mail/Passwort aktivieren, den einen Account manuell anlegen.
4. Security Rules veröffentlichen (siehe oben) – direkt im Console-Editor, kein CLI nötig.

**Vercel:**
1. GitHub-Repo verbinden (oder `vercel`-CLI) – Vite wird automatisch erkannt
   (`npm run build`, Output `dist`).
2. Env-Variablen im Vercel-Dashboard setzen: `VITE_FIREBASE_API_KEY`,
   `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` (gespiegelt in einer
   gitignorten lokalen `.env.local`).
3. Deploy → kostenlose `*.vercel.app`-Domain.
4. Diese Vercel-Domain zu Firebase Auths "Authorized Domains" hinzufügen (sonst schlägt der
   Login fehl).
5. Auf dem iPhone: URL in Safari öffnen, anmelden, "Teilen" → "Zum Home-Bildschirm",
   über das Icon neu starten, Standalone-Modus + Offline-Review bei ausgeschaltetem Netz
   verifizieren.

## Verifikation

- Nach Schritt 5/6: Review-Flow lokal testen, dann Netzwerk in den Devtools kappen und
  bestätigen, dass fällige Karten weiterhin abgefragt und bewertet werden können
  (Firestore-Offline-Cache).
- Nach Schritt 8: eine Lektion importieren, eine Karte darin bewerten (SRS-Felder ändern
  sich), dieselbe Datei erneut importieren, prüfen dass `repetitions`/`easeFactor`/`dueDate`
  unverändert bleiben und nur Inhaltsfelder aktualisiert wurden.
- Nach Schritt 11: echter Gerätetest auf dem iPhone – Installation über den Home-Bildschirm,
  vollständiger Review-Durchlauf im Flugmodus.
- Abschließend: Deploy auf Vercel, Login von einem frischen Browser-Profil aus testen (um
  sicherzustellen, dass Authorized Domains/Env-Variablen korrekt gesetzt sind).
