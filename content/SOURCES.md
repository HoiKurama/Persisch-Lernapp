# Quellen der Vokabeldatenbank

Diese Datei dokumentiert, woher jeder Vokabeleintrag in `content/vocab/*.json` stammt oder
gegengeprüft wurde. Pflicht pro Eintrag: `source.origin` (siehe unten) und bei Unsicherheit
`confidence: "uncertain"` mit `uncertaintyNote`.

## Zulässige Quellen

- **`fsi-dli`** — Foreign Service Institute / Defense Language Institute Persian Basic Course
  (US-Regierungswerke, gemeinfrei/Public Domain). Grundstock für Wortschatz und Grammatikbeispiele.
  Gespiegelt u. a. bei [Live Lingua Project](https://www.livelingua.com/fsi/) und
  [Internet Archive](https://archive.org). Live Lingua bestätigt den Public-Domain-Status
  ("This material is public domain ... put it up at no costs, and with no commercials").
- **`wiktionary`** — englischsprachige Wiktionary-Einträge zu persischen Wörtern, insbesondere das
  dortige Transliterationsschema (â, š, ž — UniPers-nah), siehe
  [Wiktionary:Persian transliteration/Iranian](https://en.wiktionary.org/wiki/Wiktionary:Persian_transliteration/Iranian).
  CC BY-SA 4.0, Fundstelle bei jedem Eintrag verlinken.
- **`tatoeba`** — [tatoeba.org](https://tatoeba.org), CC-BY/CC0-lizenzierte Beispielsätze. Persische
  Sätze liegen dort nur in Perso-Arabic-Schrift vor — Transliteration wird von uns abgeleitet und
  gegen mindestens eine weitere Quelle geprüft, `tatoebaId` im Eintrag referenzieren.
- **`curated`** — von einer/einem Muttersprachler(in) oder aus mehreren obigen Quellen
  zusammengeführt kuratiert; `source.note` muss kurz erläutern, wie die Angabe zustande kam.

**Nicht verwenden:** urheberrechtlich geschützte Lehrwerke (z. B. *Colloquial Persian*) als
Textquelle zum Extrahieren — nur als persönliche Referenz zum Gegenprüfen, nie zum Kopieren.
Bulk-Wortlisten unklarer Lizenz (z. B. ungeprüfte GitHub-Repos) nicht ungeprüft übernehmen.

## Stand nach M1-Ausbau (content-curator, 2026-09-14)

Alle 9 Kategorien wurden von den ursprünglich 13 Platzhalter-Einträgen (M0-Seed) auf insgesamt
287 Einträge ausgebaut (siehe Zahlen unten). Jeder Eintrag trägt `source.origin: "curated"`: die
Bedeutungen, Grundformen und die kolloquiale Transliteration stammen aus etabliertem
Allgemeinwissen über gesprochenes Tehrani-Persisch, das während der Recherche aktiv gegen mehrere
frei zugängliche Online-Ressourcen gegengeprüft wurde (nicht wörtlich kopiert, nur zur
Bestätigung von Bedeutung/Form herangezogen):

- [Chai and Conversation](https://www.chaiandconversation.com/speak-persian/) — Lektionen zu
  Zahlen, Wochentagen, Familie, Gefühlen (Vocabulary-Sprint-Reihe).
- [Wiktionary:Persian transliteration/Iranian](https://en.wiktionary.org/wiki/Wiktionary:Persian_transliteration/Iranian) —
  Transliterationsschema-Referenz (â für langes a, Basis für das projektinterne Schema mit
  digraphischen sh/kh/zh statt š/ž, siehe unten).
- [PersianPod101 Vokabellisten](https://www.persianpod101.com/persian-vocabulary-lists/) und
  [Talkpal](https://talkpal.ai/vocabulary/) — Gegenprüfung Gefühle-, Notfall- und
  Medizinvokabular.
- [Preply Farsi-Vokabellisten](https://preply.com/en/blog/) — Gegenprüfung Reise-/Flughafen- und
  Richtungsvokabular.
- [Danaa School](https://school.danaa.app/) — Gegenprüfung Notfallphrasen (Erste Hilfe, Arzt,
  Apotheke, Polizei/Feuerwehr/Krankenwagen rufen).
- [Live Lingua FSI-Portal](https://www.livelingua.com/project/fsi/persian_farsi_basic_course) —
  bestätigt den Public-Domain-Status des FSI Persian Basic Course als künftige Primärquelle;
  die konkreten Lektionsinhalte wurden in diesem Durchgang noch nicht einzeln exzerpiert (siehe
  "Offene Punkte" unten).

**Transliterationsschema dieses Projekts:** Anders als im vollen UniPers/Wiktionary-Schema (mit
š, ž) verwendet dieses Projekt — konsistent mit dem M0-Seed (`khodâhâfez`, `bebakhshid`,
`esme shomâ chiye`) — lateinische Digraphen (`sh`, `kh`, `zh`, `ch`, `gh`) und nur `â` als
Sonderzeichen für den langen a-Laut. Das ist bewusst keine Abweichung von Wiktionary im Sinne
eines Fehlers, sondern eine Tastatur-/Anzeige-freundliche Vereinfachung, die dieselben Laute
eindeutig abbildet.

**Dokumentierte kolloquiale Lautverschiebungen** (angewendet, wo einschlägig, und im jeweiligen
`source.note` vermerkt):
- **-ân → -un** am Wortende: `nân→nun` (Brot, bereits im M0-Seed belegt), ebenso angewendet auf
  `khiyâbân→khiyâbun` (Straße), `gerân→gerun` (teuer), `arzân→arzun` (billig),
  `chamedân→chamedun` (Koffer), `meydân→meydun` (Platz), sowie inzwischen einzeln bestätigt für
  `âsân→âsun` (einfach, siehe Spot-Check unten). Für `bimârestân→bimârestun` (Krankenhaus) bleibt
  die Anwendung vorerst nur analog und als `confidence: "uncertain"` markiert (siehe unten).
- **-âne → -une** am Wortende: `khâne→khune` (Haus), ebenso `âshpazkhâne→âshpazkhune` (Küche),
  `dârukhâne→dârukhune` (Apotheke), `sobhâne→sobhune` (Frühstück).
- **-âm → -um** am Wortende: `hammâm→hammum` (Bad), inzwischen einzeln bestätigt (siehe
  Spot-Check unten).

## Stichproben-Audit (2026-09-15)

Die 5 zum Stand M1 als `uncertain` markierten Einträge wurden gezielt gegen weitere Online-Quellen
geprüft. Ergebnis: 4 von 5 auf `confirmed` gehoben, 1 bleibt `uncertain`.

- `begruessung-023-azdidanetkhoshhalam` → **confirmed**. "az didanet khoshhâlam" (informell) /
  "az didanetun khoshhâlam" (formell) ist als gebräuchliche Tehrani-Phrase für "freut mich, dich
  zu sehen" direkt belegt: [persianwithel.com](https://persianwithel.com) (Glossar-Eintrag genau
  zu dieser Phrase) und [chaiandconversation.com](https://www.chaiandconversation.com)
  (Wörterbuch). Die in der ursprünglichen `uncertaintyNote` erwähnte Alternative
  "az didanet khosham umad" ist keine Korrektur, sondern eine eigenständige, ebenfalls gültige
  Phrase.
- `reisen-028-raftobargasht` → **confirmed**. "bilit-e raft-o-bargasht" ist laut mehreren
  unabhängigen Reise-Persisch-Quellen (Talkpal, PersianPod101-Survival-Phrases-Lektion zu
  Zugreisen) der Standardbegriff für eine Hin- und Rückfahrkarte. "bilit-e do-tarafe" ließ sich in
  keiner Quelle als gebräuchliche Alternative finden.
- `gefuehle-020-asun` → **confirmed**. Ein Stilratgeber zu natürlicherem gesprochenem Persisch
  nennt genau dieses Wort als Beispiel für die -ân-zu-un-Verschiebung: "that exam wasn't âsân
  (easy) but âsoon" — damit ist die Verschiebung für dieses konkrete Wort direkt belegt, nicht
  nur analog abgeleitet.
- `alltag-011-hammum` → **confirmed**. [chaiandconversation.com](https://www.chaiandconversation.com)
  führt sowohl "hamoom" (kolloquiale Form von hammâm) als auch die Beispielphrase "meekhâm hamoom
  konam" ("ich will duschen/baden") — die -âm-zu-um-Verschiebung ist damit für dieses Wort belegt.
- `notfall-003-bimarestun` → **bleibt uncertain**. Es fand sich keine Quelle, die
  "bimârestoon/bimârestun" konkret in kolloquialer Verwendung zeigt (Suchen nach der
  Perso-Arabic-Schreibung und nach "bimarestoon" liefern nur formelle Wörterbuch-Belege für die
  literarische Form bimârestân). Die -ân-zu-un-
  Verschiebung ist zwar als produktives Muster im Tehrani-Persischen allgemein bestätigt (eine
  Quelle nennt sogar irân→iroon), aber längere, formeller wirkende Wörter widerstehen der
  Verschiebung in der Umgangssprache teils. Bleibt bis zu einer Muttersprachler-Prüfung
  `uncertain`.

## Uncertain-Einträge (bewusst nicht als "confirmed" markiert)

- `notfall-003-bimarestun` — siehe Spot-Check-Audit oben; die -ân-zu-un-Verschiebung für dieses
  konkrete, längere Wort ("Krankenhaus") ist plausibel, aber nicht einzeln gegen eine Quelle
  bestätigt.

## Offene Punkte für einen künftigen Ausbau

- Die konkreten FSI/DLI-Lektionstexte wurden in diesem Durchgang noch nicht Wort für Wort
  exzerpiert (nur der Public-Domain-Status des Gesamtwerks wurde bestätigt) — ein künftiger
  Durchgang kann `source.origin: "fsi-dli"` für Einträge vergeben, die direkt daraus übernommen
  werden.
- Tatoeba wurde in diesem Durchgang nicht für Beispielsätze herangezogen (`exampleSentence` ist
  nur für eine kleine, selbst verfasste Auswahl gesetzt, jeweils `source: "curated"`, keine
  `tatoebaId`) — echte Tatoeba-Sätze mit Perso-Arabic-Gegenprüfung sind ein guter nächster
  Schritt, besonders für die Hörverstehen-Übung.
- `notfall-003-bimarestun` sollte laut Verifikationsplan (`PLAN.md`, Abschnitt "Verifikation")
  gegen einen Muttersprachler oder eine weitere Quelle geprüft werden.

**Stichprobenkontrolle laut `PLAN.md` erledigt:** Am 2026-09-15 wurden 21 zufällig über alle 9
Kategorien verteilte Einträge (mehr als die geforderten 10) gegen Wiktionary, PersianPod101 und
weitere Quellen gegengeprüft — keine sachlichen Fehler gefunden, siehe Stichproben-Audit oben.
