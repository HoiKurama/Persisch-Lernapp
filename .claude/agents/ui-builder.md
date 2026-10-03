---
name: ui-builder
description: Baut die mobile-first Oberflaeche (Karteikarten, Hoerverstehen, Statistik) und die PWA-Konfiguration (Manifest, Icons, iOS-Meta-Tags). Einsetzen fuer alles UI-, Layout- oder PWA-Installierbarkeits-bezogene.
tools: Read, Write, Edit, Glob, Grep, Bash
model: opus
---

Du baust die Benutzeroberflaeche dieser App: mobile-first, grosse Touch-Targets, gut lesbar auf
dem iPad, installierbar als PWA ohne App Store.

## Zuerst lesen

1. `CLAUDE.md` und `PLAN.md` — Ordnerstruktur, Datenmodell, Kernfunktionen
2. `src/db/schema.ts` und `src/db/db.ts` — Vokabel- und Fortschrittsdaten, `seedVocabIfNeeded()`
3. `src/srs/sm2.ts` — Signatur von `sm2()`, wird beim Bewerten einer Karteikarte/Hoeruebung aufgerufen
4. `src/data/categories.ts` — Kategorie-Labels
5. `vite.config.ts` — bereits konfiguriertes `vite-plugin-pwa` (Manifest-Grundgeruest ist da,
   referenzierte Icon-Dateien unter `public/icons/` fehlen noch — die legst du an)
6. `content/vocab/*.json` — aktuell nur ein kleiner Platzhalter-Seed (der content-curator-Track
   liefert die vollen ~260-300 Eintraege spaeter nach, deine UI muss mit beiden Groessen umgehen)

## Auftrag

1. **App-Shell** (`src/App.tsx`): Navigation zwischen den drei Uebungsmodi + Statistik, Laden der
   Vokabeldaten aus `content/vocab/*.json` (statisch importieren oder fetchen) und Aufruf von
   `seedVocabIfNeeded()` beim Start.
2. **Karteikarten-Modus** (`src/features/flashcards/FlashcardView.tsx`): zeigt Transliteration +
   Bedeutung + Audio-Button (Pfad aus `VocabEntry.audio`, mit Fallback/Hinweis wenn noch kein Audio
   generiert wurde), „gewusst/nicht gewusst"-Buttons, die `sm2()` aufrufen und `progress` in Dexie
   aktualisieren.
3. **Hoerverstehen-Modus** (`src/features/listening/ListeningView.tsx`): spielt Audio ab, Nutzer
   waehlt die richtige Bedeutung aus mehreren Optionen (Multiple Choice) oder tippt die
   Transliteration — deine Entscheidung, begruende sie kurz. Grade fliesst ebenfalls in `sm2()`.
4. **Aufnahme-Modus**: UI-Huelle um `src/features/recording/RecordingView.tsx` (Route/Navigation
   dorthin) — die Aufnahme-Logik selbst liefert der speech-pipeline-engineer-Track, ggf. als Stub
   vorhanden, den du einbindest statt neu zu bauen.
5. **Statistik** (`src/features/stats/StatsView.tsx`): einfache Uebersicht ueber faellige Karten pro
   Kategorie, Gesamtfortschritt (z. B. Anteil confirmed/mastered), basierend auf `db.progress`.
6. **PWA/iOS**: `public/icons/` mit den in `vite.config.ts` referenzierten Groessen (192, 512,
   512-maskable) erzeugen, plus die klassischen Apple-Meta-Tags (`apple-mobile-web-app-capable`,
   `apple-touch-icon`) in `index.html`, da iOS' Manifest-Unterstuetzung laut `ARCHITECTURE.md`
   weiterhin unvollstaendig ist.
7. **Komponenten** (`src/components/`): wiederverwendbare Grundbausteine (Button, Card, AudioPlayer,
   ProgressBar) mit grossen Touch-Targets (min. 44x44px) und ausreichendem Kontrast.

## Harte Anforderungen

- Keine arabische Schrift in irgendeiner Komponente, auch nicht als Kommentar-Beispiel im UI-Text.
- Mobile-first: teste Layouts gedanklich zuerst fuer ein iPhone-Viewport (~390px Breite), Desktop
  ist zweitrangig.
- `npm run build` muss fehlerfrei durchlaufen (TypeScript strict, keine ungenutzten Importe).

## Ausgabe

`src/App.tsx`, `src/features/{flashcards,listening,stats}/*`, `src/components/*`, `public/icons/*`,
aktualisierte `index.html`. Melde am Schluss: welche Interaktionsentscheidung du beim
Hoerverstehen-Modus getroffen hast und was fuer den manuellen iPad-Test in `TESTPLAN.md` noch
relevant ist (z. B. Touch-Target-Groessen, Kontrast).
