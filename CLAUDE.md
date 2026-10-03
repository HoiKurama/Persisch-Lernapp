# Persisch-Lernapp

Aktueller Stand und nächste Schritte: [PROJECT_STATE.md](PROJECT_STATE.md).

Web-App (PWA), damit ein Lehrer Persisch (Farsi) **sprechen und verstehen** lernt — nicht lesen
oder schreiben. Hintergrund und Architekturentscheidung stehen in [`PLAN.md`](PLAN.md) und
[`ARCHITECTURE.md`](ARCHITECTURE.md), bitte vor größeren Änderungen lesen.

## Harte Regeln (nicht verhandelbar)

1. **Keine arabische/Perso-Arabic-Schrift irgendwo im UI oder in `content/vocab/*.json`.**
   Nur Lateinschrift-Transliteration. Automatisch geprüft durch
   `npm run validate-vocab` und `src/content/no-perso-arabic.test.ts` — beide müssen grün sein.
   Die einzige Ausnahme ist `content/tts-source/*.json` (build-intern, für die Azure-TTS-Generierung,
   wird nie importiert oder ausgeliefert).
2. **Keine erfundenen Vokabeldaten.** Jeder Eintrag in `content/vocab/*.json` braucht ein
   `source.origin` und, wenn unsicher, `confidence: "uncertain"` mit `uncertaintyNote`. Siehe
   `content/SOURCES.md` für die zulässigen Quellen.
3. **Aussprachefeedback ist eine v1-Annäherung**, keine Phonem-Analyse (siehe `ARCHITECTURE.md`,
   Abschnitt „Aussprachebewertung"). Im UI und in Texten ehrlich kommunizieren, nicht mehr
   Präzision suggerieren als tatsächlich geliefert wird.

## Befehle

```bash
npm run dev              # lokaler Dev-Server
npm run test             # Vitest (SM-2, Vokabel-Schema, Perso-Arabic-Scanner)
npm run validate-vocab   # Vokabeldaten gegen Schema + Schriftzeichen-Guard prüfen
npm run build             # Produktions-Build
```

## Struktur

- `src/db/` — Datenmodell (TypeScript-Typen) + Dexie/IndexedDB-Anbindung
- `src/srs/` — SM-2-Spaced-Repetition, reine Funktionen
- `src/features/` — Karteikarten-, Aufnahme-, Hörverstehen- und Statistik-Ansicht
- `shared/transliteration.ts` — Perso-Arabic→Latein-Skelettvergleich, von `api/` UND `src/` genutzt
- `api/check-pronunciation.ts` — einzige Vercel-Serverless-Function (Whisper-Anbindung)
- `content/vocab/*.json` — Vokabeldaten (Perso-Arabic-frei), `content/SOURCES.md` — Quellenbeleg
- `scripts/` — `validate-vocab.ts` (Datenprüfung), `generate-audio.ts` (einmalige Azure-TTS-Generierung)
- `.claude/agents/` — Subagenten für die vier parallelen Bau-Tracks (Inhalt, Sprachpipeline, UI, QA)

## Git

Dieses Projekt liegt im geteilten Root-Repo `Claude Projects` auf dem eigenen Branch
`persisch-lernapp`. Root-Konventionen (Ordnernamen, Commit-Stil) gelten, siehe die CLAUDE.md
im Wurzelordner.
