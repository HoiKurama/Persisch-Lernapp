# TTS-Source (build-intern)

Dieser Ordner enthält die Perso-Arabic-Schriftformen der Vokabeln, ausschließlich als Eingabe für
`scripts/generate-audio.ts` (Azure-TTS-Generierung). Er wird **niemals** in die ausgelieferte App
importiert oder gebündelt — die Trennung von `content/vocab/*.json` (Perso-Arabic-frei, Pflicht)
ist bewusst, damit das „keine arabische Schrift im UI"-Requirement strukturell nicht verletzt werden
kann.

Format: eine JSON-Datei pro Kategorie, gleiche IDs wie in `content/vocab/*.json`, z. B.:

```json
[{ "id": "begruessung-001-salam", "persoArabic": "سلام" }]
```

Wird vom `content-curator`-Track befüllt (der ohnehin Perso-Arabic-Schrift für die Recherche sieht)
und vom `speech-pipeline-engineer`-Track in `scripts/generate-audio.ts` gelesen.
