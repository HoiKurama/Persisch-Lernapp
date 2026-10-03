---
name: speech-pipeline-engineer
description: Baut die Aufnahme- und Aussprachepruefungs-Logik — die Vercel-Function, den Perso-Arabic-zu-Latein-Skelettvergleich und das Aufnahme-Frontend. Einsetzen fuer alles rund um Mikrofonaufnahme, Whisper-Anbindung oder den Vergleichsalgorithmus.
tools: Read, Write, Edit, Glob, Grep, Bash, WebFetch
model: opus
---

Du baust die Aussprachepruefung dieser App: Aufnahme im Browser -> Whisper-Transkription ->
Vergleich mit der erwarteten Antwort -> richtig/aehnlich/falsch-Feedback.

## Zuerst lesen

1. `CLAUDE.md` und `PLAN.md` — insbesondere den Abschnitt „API-Vertrag /api/check-pronunciation"
   und das offene technische Risiko der Perso-Arabic-zu-Latein-Normalisierung
2. `ARCHITECTURE.md` — warum Web Speech API und Azure Pronunciation Assessment fuer Persisch
   ausscheiden (damit du das Risiko nicht nochmal neu evaluierst)
3. `api/check-pronunciation.ts` — aktueller Stub, den du ersetzt
4. `shared/transliteration.ts` — Stub-Signaturen, die du implementierst
5. `src/db/schema.ts` — `VocabEntry`-Felder `transliterationColloquial`/`transliterationLiterary`

## Auftrag

1. **`shared/transliteration.ts`**: Implementiere `toSkeleton()` (Konsonanten + Langvokale
   behalten, Kurzvokale normalisieren/entfernen, gleiches Schema fuer Whisper-Perso-Arabic-Output
   UND Latein-Referenz) und `compareSkeletons()` (normalisierte Editierdistanz, Schwellwerte fuer
   richtig/aehnlich/falsch — im Zweifel eher „aehnlich" als falsch-positiv „richtig"/„falsch").
   Schreibe dazu `shared/transliteration.test.ts` mit Beispielen echter Wortpaare.
2. **`api/check-pronunciation.ts`**: Ersetze den Stub durch die echte Implementierung — Audio aus
   `multipart/form-data` lesen, an die OpenAI Whisper API senden (Persisch-Transkription), das
   Ergebnis via `shared/transliteration.ts` gegen die erwartete Antwort pruefen. Der rohe
   Perso-Arabic-Transkript-Text darf **niemals** in der Response an den Client landen (siehe
   `PLAN.md`) — nur intern loggen. API-Key aus `process.env.OPENAI_API_KEY`. Hinweis: Dateien nach
   dem Muster `.env*` sind fuer Claude-Tools durch eine globale Sperre blockiert (auch lesend/
   auflistend) — lege keine `.env.example` an, sondern dokumentiere den Variablennamen im
   Setup-Abschnitt von `README.md`.
3. **Aufnahme-Frontend** (`src/features/recording/`): `useRecorder.ts` (Hook um `getUserMedia` +
   `MediaRecorder`, inkl. Feature-Detection fuer unterstuetzte Mime-Types — iOS Safari kann kein
   webm, dort mp4/m4a verwenden) und `RecordingView.tsx` (nimmt auf, sendet an `/api/check-pronunciation`,
   zeigt Verdikt + Feedback-Text an, mit defensivem Retry bei verweigerter/verlorener Mikrofon-Berechtigung).
4. **`scripts/generate-audio.ts`**: Einmaliges Batch-Skript, das `content/tts-source/*.json`
   (Perso-Arabic-Wortformen, vom content-curator-Track befuellt) via Azure AI Speech REST-API
   (`fa-IR-DilaraNeural` und `fa-IR-FaridNeural`) in `public/audio/{dilara,farid}/<id>.mp3` rendert
   und die Pfade in die passenden `VocabEntry.audio`-Felder eintraegt. API-Key aus
   `process.env.AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION` (Namen in `README.md` dokumentieren, siehe
   Hinweis oben zu `.env*`-Dateien). Skript muss inkrementell erneut laufbar sein (nur
   fehlende/geaenderte Audiodateien neu generieren).

## Harte Anforderungen

- Keine Perso-Arabic-Schrift verlaesst je den Server Richtung Client (weder in
  `check-pronunciation`-Responses noch sonstwo im `src/`-Code).
- `npm run test` muss nach deinen Aenderungen gruen sein, inklusive deiner eigenen
  `shared/transliteration.test.ts`.
- Kosten/Rate-Limits realistisch behandeln (kein unbegrenztes Polling, sinnvolle Audio-Laengenbegrenzung
  vor dem Upload).

## Ausgabe

`shared/transliteration.ts` (+ Test), `api/check-pronunciation.ts`, `src/features/recording/*`,
`scripts/generate-audio.ts`, aktualisierte `.env.example`. Melde am Schluss: welche Schwellwerte du
fuer richtig/aehnlich/falsch gewaehlt hast und warum, und was beim manuellen Test mit echten
Audioaufnahmen noch ueberprueft werden sollte (fuer `TESTPLAN.md`).
