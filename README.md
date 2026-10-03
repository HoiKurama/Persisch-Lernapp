# salâm · Persisch hören und sprechen

Eine persönliche Lernapp für gesprochenes iranisches Persisch. Keine Schreibübungen;
Lautschrift erscheint beim Sprechen erst als Hilfe. Aktueller Projektstand: [PROJECT_STATE.md](PROJECT_STATE.md).

## Starten

Node.js 24 und npm sind vorhanden.

```sh
npm install
npm run dev
```

Die lokale Adresse steht im Terminal (normalerweise http://localhost:5173).
Der Dev-Server enthält auch den optionalen Endpunkt für Spracherkennung.

## Was du jetzt nutzen kannst

- **Heute:** Tagesziel von zehn Übungen und direkter Einstieg.
- **Hören:** erst Audio, dann Bedeutungswahl und Nachsprechen; Normaltempo oder 0,75×.
- **Kennenlernen:** neue vertonte Ausdrücke zuerst ganz hören und laut nachsprechen;
  danach erfolgt die Abfrage aus dem Gedächtnis. Kennenlernen vergibt noch keine Lernnote.
- **Sprechen:** deutscher Impuls, laut antworten, optional aufnehmen und selbst vergleichen.
  Die Lösung bleibt bis zum Antippen verborgen. Nach einer Hilfe zählt die Antwort als unsicher.
  Unter **Alltagssituationen** findest du drei Rollenübungen: Kennenlernen, Höflichkeit
  und Verständigung. Ausdrücke ohne Hörbeispiel sind im regulären Training optional zuschaltbar.
- **Wortschatz:** 287 Ausdrücke in neun Themen, mit Suche und aufklappbaren Hilfen.
- **Fortschritt:** Hören und Sprechen getrennt; Download einer Sicherungsdatei.

Eine reguläre Einheit enthält höchstens zehn Abfragen, davon höchstens fünf neue Ausdrücke.
Die zugehörigen Lernschritte kommen zusätzlich davor. Rollenübungen folgen ihrer festen
Gesprächsfolge und können freiwillig erneut geübt werden.
Fällige Wiederholungen kommen zuerst. Schwierige Antworten erscheinen einmal zusätzlich in
derselben Einheit und sind nach zehn Minuten erneut fällig. Diese zusätzliche Übung verlängert
das Wiederholungsintervall nicht.

## Stand der Hördateien

**22 von 287 Ausdrücken** haben lokale Originalaufnahmen, unter anderem Hallo, Auf Wiedersehen,
Wasser, Tee, Buch, Schule und Lehrer/Lehrerin.
Quellen, Urheber und Lizenzen stehen in [content/audio-credits.json](content/audio-credits.json)
und in der App unter Fortschritt. Die Dateien wurden unverändert übernommen.

Der Rest des Audiowortschatzes ist noch offen. Azure Speech ist nach Rückmeldung des Nutzers
noch nicht eingerichtet. Auch die vollständigen geprüften Eingabetexte für Azure in
`content/tts-source/` fehlen. Das vorhandene Generierungsskript allein erzeugt deshalb noch
keinen vollständigen Audiokurs. Alternativ können passende, lizenzierte Aufnahmen ergänzt werden.

Weitere passende Commons-Aufnahmen importieren:

```sh
npm run import-audio
```

Das Skript erhält vorhandene Aufnahmen und Nachweise, fragt Metadaten gebündelt ab und
speichert jeden erfolgreichen Import. Nicht vorhandene Aufnahmen werden übersprungen;
temporäre Downloadfehler ergeben einen Fehlerstatus. Beim letzten Lauf waren 13 Downloads
vorübergehend nicht verfügbar. Mehrdeutige Wortformen und abweichende literarische Formen
werden nicht als Ersatz für Umgangssprache eingetragen.

## Optionale Spracherkennung

Für das Üben und eigene Aufnahmen ist kein Cloud-Zugang nötig. Erst **„Erkennung starten“**
sendet die aktuelle Aufnahme an den konfigurierten Server und weiter an OpenAI.
Transkription und Textähnlichkeit ergeben nur eine grobe Erkennung des Ausdrucks;
sie beurteilen keine einzelnen Laute und vergeben keine Lernnote automatisch.

Für die optionale Funktion lokal eine nicht eingecheckte `.env` mit `OPENAI_API_KEY`
anlegen und den Dev-Server neu starten. Keine `VITE_`-Variable für geheime Schlüssel verwenden.
Bei einem Vercel-Deployment den Schlüssel dort als serverseitige Umgebungsvariable setzen.
Es wurde kein Cloud-Dienst eingerichtet und nichts veröffentlicht.

Für die spätere Azure-Generierung benötigt `npm run generate-audio` zusätzlich
`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` und geprüfte TTS-Eingaben.
Die tatsächlichen Gebühren richten sich nach dem jeweiligen Anbieter und Verbrauch.

## Daten und Offline-Nutzung

Der Fortschritt bleibt in IndexedDB in diesem Browser. Die Datenbankmigration rekonstruiert
getrennte Fähigkeiten aus dem bisherigen Bewertungsprotokoll; alte Tabellen bleiben erhalten.
Ein erfolgreicher Lesekarten-Versuch wird nicht als Sprechleistung übernommen.
Inhaltliche Änderungen aktualisieren die Wortliste ohne Fortschrittsverlust.

Der Produktions-Build speichert App und mitgelieferte Hördateien im PWA-Cache.
Nach vollständigem ersten Laden können sie offline verfügbar sein. Cloud-Erkennung benötigt Internet.
Der Entwicklungsserver installiert keinen Produktions-Service-Worker.
Echte iPhone-/iPad-Aufnahmen, Installation und Offline-Neustart sind noch am Gerät zu prüfen.
Browserdaten können gelöscht werden; der Export dient als Sicherung. Eine Importoberfläche fehlt noch.

## Prüfungen

```sh
npm run build
npm test
npm run lint
npm run validate-vocab
```

Details zu Architektur und manuellen Checks: [ARCHITECTURE.md](ARCHITECTURE.md), [TESTPLAN.md](TESTPLAN.md).
