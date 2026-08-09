# Koreanisch lernen

Mobile PWA zum Koreanisch lernen mit Karteikarten (SM-2 Spaced Repetition) für Vokabeln
und Grammatik. Details siehe [umsetzungsplan.md](umsetzungsplan.md).

## Setup

```
npm install
```

Firebase-Zugangsdaten in `.env.local` eintragen (Werte aus der Firebase Console,
Projekteinstellungen → Meine Apps → Web-App):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

`.env.local` ist gitignored und wird nicht committet.

## Entwicklung

```
npm run dev
```

## Build

```
npm run build
npm run preview
```
