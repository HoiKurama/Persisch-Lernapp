# Persisch-Lernapp (Sprechen & Verstehen)

> Historischer Aufbauplan. Der aktuelle Stand und die nächsten Schritte stehen in
> [PROJECT_STATE.md](PROJECT_STATE.md); aktuelle Technik in [ARCHITECTURE.md](ARCHITECTURE.md).
> Insbesondere Node-Blockade, gemeinsame Lernintervalle und automatisch bewertete Aussprache
> in diesem ursprünglichen Plan entsprechen nicht mehr der Umsetzung.

## Kontext

Der Nutzer ist Lehrer und möchte Persisch (Farsi) **sprechen und verstehen** lernen — ausdrücklich
nicht lesen oder schreiben. Der ursprüngliche Auftrag liegt als Prompt-Datei vor
(`claude-code-prompt-persisch-app.md`); der Nutzer hat danach präzisiert, dass es *nur* um
mündliche Produktion (Sprechen) und Hörverstehen geht, nicht um irgendeine Schreib-/Leseübung —
auch nicht in Lautschrift.

Drei Recherchen (Aussprachebewertung/PWA, Vokabelquellen/TTS, SM-2/Architektur) haben eine
zentrale Weichenstellung ergeben: **Es gibt keine Cloud-API mit echtem Phonem-Feedback für
Persisch** (Azure Pronunciation Assessment unterstützt `fa-IR` nicht; iOS Web Speech API scheidet
aus, weil Apples Diktier-Engine gar kein Farsi-Modell hat — nicht nur „unzuverlässig", sondern
technisch nicht vorhanden). Der Nutzer hat sich daraufhin bewusst für die realistische v1-Lösung
entschieden: Whisper-Transkription + Ähnlichkeitsabgleich statt echter Aussprachekorrektur, und für
Vite+React/Dexie/Vercel als Unterbau, mit einer größeren Start-Vokabelliste (~250-300 Einträge).
Dieser Plan setzt genau diese Entscheidungen um.

**Wichtige Blockade vorab:** Node.js/npm sind auf diesem Rechner nicht auffindbar (weder Bash noch
PowerShell). Das muss vor dem Scaffolding geklärt werden — siehe Schritt 0 unten.

## Architekturentscheidung (Kurzfassung für `ARCHITECTURE.md`)

- **Kein Web-Speech-API-Ansatz.** Apples Diktier-Engine kennt kein Farsi (offizielle
  Feature-Verfügbarkeitsliste), daher ist rein client-seitige Spracherkennung für dieses Projekt
  technisch ausgeschlossen, nicht nur unzuverlässig.
- **Server-seitige Lösung:** OpenAI Whisper API transkribiert die Aufnahme (unterstützt Persisch).
  Eine kleine Vercel-Serverless-Function ruft Whisper auf und vergleicht die Transkription mit der
  erwarteten Antwort. Ergebnis ist ein Grobverdikt (richtig/ähnlich/falsch), **keine
  Phonem-Analyse** — das wird im UI und in `ARCHITECTURE.md` ehrlich kommuniziert.
  Kosten: ca. 1–5 €/Monat bei beschriebener Nutzung.
- **PWA statt App Store:** Vite + React, `vite-plugin-pwa` für Manifest/Service Worker, Add-to-
  Home-Screen auf iPhone/iPad. `getUserMedia`/`MediaRecorder` funktionieren in dem Modus, sind aber
  bekanntermaßen fragil bei iOS-Punktupdates — defensives Retry/Permission-Handling einplanen.
- **Persistenz:** Dexie.js (IndexedDB) lokal-first für Vokabeln und Fortschritt. Einmal echt
  installierte Home-Screen-PWAs sind von Safaris 7-Tage-Storage-Löschung ausgenommen.
- **Spaced Repetition:** klassischer SM-2-Algorithmus, handgeschrieben (~40 Zeilen, volle
  Kontrolle über das richtig/ähnlich/falsch→Grade-Mapping, keine Fremdabhängigkeit nötig).
- **TTS:** Azure AI Speech, `fa-IR-DilaraNeural` / `fa-IR-FaridNeural` — einmalige Generierung
  beim Setup, danach als statische Audiodateien im Repo, Kosten praktisch 0 € (Freikontingent).

## Datenmodell

**Vokabeleintrag** (`content/vocab/*.json`, Schema in `content/vocab.schema.json`) — enthält
**strukturell kein arabisches Schriftfeld**:

```ts
interface VocabEntry {
  id: string;                    // z.B. "alltag-003-salam"
  category: CategoryId;
  german: string;                              // Bedeutung
  transliterationColloquial: string;            // Umgangssprache, primär: z.B. "nun"
  transliterationLiterary?: string;             // nur wenn abweichend: z.B. "nân"
  exampleSentence?: { transliteration: string; german: string; source?: 'tatoeba'|'fsi-dli'|'curated' };
  audio: { dilara?: string; farid?: string };
  source: { origin: 'fsi-dli'|'wiktionary'|'tatoeba'|'curated'; note?: string };
  confidence: 'confirmed' | 'uncertain';        // Pflichtfeld gegen Halluzination
  uncertaintyNote?: string;
}
```

Ein automatischer Guard (`scripts/validate-vocab.ts`, plus qa-tester-Test) scannt `content/` und
`dist/` auf Perso-Arabic-Unicode-Bereiche (U+0600–06FF u.a.) — die Abwesenheit arabischer Schrift
ist damit technisch erzwungen, nicht nur Konvention.

**Fortschritt** (Dexie, IndexedDB): `progress` (ein Datensatz pro Vokabel: easeFactor, interval,
repetitions, dueDate) + `reviewLog` (append-only, je Review: mode, grade, verdict). Ein gemeinsamer
SM-2-Track pro Vokabel über alle drei Modi (Karteikarte/Aufnahme/Hörverstehen), `mode` im Log
erhält die Zuordnung für die Statistik.

## API-Vertrag `/api/check-pronunciation`

Request: Audio-Blob (Format abhängig von `MediaRecorder.isTypeSupported`, iOS liefert kein webm)
+ erwartete Antwort. Response: `{ transcriptLatin, verdict, score, feedback, expected }` — der rohe
Perso-Arabic-Whisper-Output verlässt den Server **nie** Richtung Client.

**Offenes technisches Risiko, bewusst in Kauf genommen:** Whisper liefert Perso-Arabic-Schrift,
die App vergleicht gegen Lateinschrift-Referenzen. Da Kurzvokale im Perso-Arabic nicht geschrieben
werden, gibt es keine allgemeine, sauber lösbare Transliteration. Lösung für den geschlossenen
~300-Wörter-Wortschatz: beide Seiten (Whisper-Output und Referenz) werden auf ein
Konsonanten+Langvokal-„Skelett" reduziert (gleiches UniPers-Schema wie die Vokabeldaten) und per
normalisierter Editierdistanz verglichen, mit Schwellwerten für richtig/ähnlich/falsch. Das ist
explizit eine v1-Annäherung — im Zweifel eher „ähnlich" statt falsch positiv „richtig"/„falsch".
Falls sich das nach echten Tests als zu ungenau erweist: gröberer Fallback (nur
Anfangskonsonant+Silbenzahl), dokumentiert in `ARCHITECTURE.md`.

## Ordnerstruktur (Auszug)

```
persisch-lernapp/
├── ARCHITECTURE.md  README.md  TESTPLAN.md  PLAN.md
├── .claude/agents/{content-curator,speech-pipeline-engineer,ui-builder,qa-tester}.md
├── src/
│   ├── db/{schema.ts, db.ts}
│   ├── srs/{sm2.ts, sm2.test.ts}
│   ├── features/{flashcards, recording, listening, stats}/
│   └── components/
├── shared/transliteration.ts        # Skelett-Normalisierer, von api/ UND src/ genutzt
├── api/check-pronunciation.ts       # einzige Vercel-Function
├── scripts/{generate-audio.ts, validate-vocab.ts}
└── content/
    ├── vocab/{alltag,reisen,small-talk,...}.json   # Perso-Arabic-frei
    ├── vocab.schema.json  SOURCES.md
    └── tts-source/*.json             # NUR build-intern: Persisch-Schrift für Azure-TTS-Input
```

Kategorien für die ~260-300 Einträge: Begrüßung & Small Talk, Alltag & Haus, Reisen & Unterwegs,
Essen & Trinken, Zahlen/Zeit/Wochentage, Familie & Beziehungen, Gefühle & Meinungen, Schule & Beruf
(Lehrer-Kontext), Notfall & Gesundheit.

Quellen für die Vokabeldaten: FSI/DLI Persian Basic Course (Public Domain, US-Regierungswerk) als
Grundstock, Wiktionary-Transliterationsschema (â, š, ž) zum Gegenprüfen, Tatoeba (CC-lizenziert)
für Beispielsätze (dort nur Perso-Arabic vorhanden → eigene Transliteration nötig, gegengeprüft).
Kolloquiale Aussprache ist das primäre Transliterationsfeld (z.B. „nun" statt „nân" für Brot), die
literarische Form nur sekundär, wo sie abweicht. Alles dokumentiert in `content/SOURCES.md`;
unsichere Einträge werden markiert, nicht erfunden.

## Meilensteine

**Schritt 0 — Voraussetzung klären:** Node.js/npm sind hier nicht installiert. Vor dem
Scaffolding: Nutzer fragen, ob ich die Installation (z.B. via `winget install OpenJS.NodeJS.LTS`)
anstoßen soll, oder ob er es selbst installiert — Software-Installation ist eine System-Änderung,
die ich nicht ohne ausdrückliche Zustimmung vornehme.

**M0 — Fundament (sequenziell):** Ordner umbenennen `Persich lernapp` → `persisch-lernapp`, neuen
Branch anlegen (von `main`, weg vom fremden `ckb-kassenbuch-auswertung`), Vite+React+TS scaffolden,
Dexie/vite-plugin-pwa/vitest installieren, Datenmodell-Contracts + API-Stub + SM-2-Signatur
committen, kleine Seed-Vokabelliste (10-15 Wörter) für parallele UI-Arbeit.

**M1 — Vier parallele Subagent-Tracks** (Format wie bestehendes `Schule/.claude/agents/fachdidaktik.md`):
- `content-curator`: Vokabeldaten + Quellenangaben + TTS-Source (Read/Write/WebSearch, kein
  Zugriff auf App-Logik)
- `speech-pipeline-engineer`: `api/`, `shared/transliteration.ts`, Aufnahme-Frontend, Azure-TTS-Skript
- `ui-builder`: PWA-Shell, Karteikarten/Hörverstehen/Statistik-Views, Manifest/iOS-Meta-Tags
- `qa-tester`: SM-2-Tests, Perso-Arabic-Scanner-Test, Vokabel-Schema-Validierung, `TESTPLAN.md`

**M2 — Integration:** echte Vokabeldaten einspeisen, TTS real generieren, API-Stub durch echte
Whisper-Anbindung ersetzen, Vercel-Preview-Deploy, End-to-End-Test.

**M3 — Doku & Abschluss:** `README.md` (Setup, Deploy **per Vercel CLI** — Repo hat keinen GitHub-
Remote, kein Git-Push-Deploy möglich —, Home-Screen-Anleitung), `ARCHITECTURE.md` fertigstellen
(inkl. der fa-IR/Web-Speech-Sackgassen), `content/SOURCES.md`, Kostenhinweis im README.

## Verifikation

- `npm run test` (Vitest): SM-2-Intervallberechnung (Grenzfälle: Reset bei grade<3, EF-Untergrenze
  1.3, Intervallfolge 1→6→interval×EF), Perso-Arabic-Codepoint-Scanner über `content/` und `dist/`,
  Vokabel-Schema-Validierung.
- Lokaler Dev-Server (`npm run dev`), manuelles Durchklicken aller drei Modi (Karteikarte,
  Aufnahme, Hörverstehen) im Browser.
- `TESTPLAN.md`-Checkliste manuell auf echtem iPhone/iPad in Safari: Add-to-Home-Screen,
  Mikrofon-Berechtigung, Aufnahme+Feedback-Flow, Offline-Verhalten nach Neustart.
- Stichprobenkontrolle: mindestens 10 zufällige Vokabeleinträge gegen die genannten Quellen
  (FSI/DLI, Wiktionary) manuell gegenprüfen, bevor die App als „fertig" gilt.
