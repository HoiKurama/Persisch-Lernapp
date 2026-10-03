# Architektur · Stand 2026-09-16

## Lernziel und Oberfläche

Gesprochenes iranisches Persisch verstehen und selbst produzieren. React + TypeScript + Vite,
Dexie für lokalen Fortschritt, vite-plugin-pwa für den Produktions-Cache.
Navigation: Heute, Hören, Sprechen, Wortschatz, Fortschritt. Die früheren Lesekarten sind durch
ein Nachschlagewerk ersetzt. Lernaufgaben stehen in `src/features/practice/`.

Beim Hören erscheint kein persischer Text vor der Antwort. Die Auswahl ist bis zur tatsächlichen
Audio-Wiedergabe gesperrt. Antwortmöglichkeiten haben verschiedene deutsche Bedeutungen;
Ablenker aus demselben Thema werden bevorzugt. Beim Sprechen steht zuerst nur der deutsche
Impuls; eine eingeblendete Hilfe verhindert die Bewertung als selbstständig gewusst.

`buildPracticePlan` ergänzt vor der ersten Abfrage neuer vertonter Ausdrücke eine Lernphase:
vollständig hören und laut nachsprechen, anschließend getrennt abrufen. Ohne Bewertung in
der Lernphase entsteht kein Fortschrittsereignis. Überspringen entfernt auch die spätere Abfrage.
Reguläres Sprechen verwendet zunächst nur vertonte Einträge; weitere Ausdrücke sind zuschaltbar.
Die drei Rollenübungen unter Sprechen verwenden bestätigte bestehende Einträge und deutsche
Situationsimpulse aus `src/data/situations.ts`. Ihre Abfragen behalten die Gesprächsfolge;
sie verwenden dieselben Sprechintervalle und können freiwillig wiederholt werden.

## Fortschritt und Migration

Dexie-Schema v2 ergänzt `skillProgress` mit zusammengesetztem Schlüssel `[vocabId+mode]`.
Die alten Tabellen `progress` und `reviewLog` bleiben erhalten. Die Migration spielt vorhandene
Logs chronologisch pro Fähigkeit nach. Alte Daten ohne zuordenbare Logs bleiben als Altbestand
erhalten, erzeugen aber keine erfundene Hören-/Sprechen-Leistung.

`recordReview` aktualisiert Fähigkeit und Protokoll in einer Transaktion. Gleichzeitige
Doppelklicks werden im Lernablauf gesperrt. Mehrfache Erfolge am selben Tag verlängern ein
bereits erfolgreiches Intervall nicht erneut. Fehlversuche bleiben nach zehn Minuten fällig.

`selectSession`: maximal zehn reguläre Aufgaben, davon maximal fünf neue bestätigte Ausdrücke;
überfällige Aufgaben zuerst. Ein Fehler erzeugt höchstens eine zusätzliche Wiederholung in der
Einheit, ohne ein zweites Protokollereignis. Hören und Sprechen beeinflussen ihre jeweiligen
Intervalle unabhängig. Die Tageszählung zählt jeden Ausdruck pro Fähigkeit einmal.

„Gefestigt“ ist eine transparente Produktdefinition: mindestens drei erfolgreiche Wiederholungen
und mindestens sieben Tage Intervall. Das ist keine Garantie für dauerhaftes Beherrschen.

## Audio und Aufnahme

`audio.dilara` / `audio.farid` bleiben für Azure vorgesehen; `audio.reference` bezeichnet
lokale, lizenzierte Originalaufnahmen. 22 Beispiele sind eingebunden. Nachweise stehen in
`content/audio-credits.json` und sind im UI zugänglich. Alle mitgelieferten WAV/OGG/MP3-Dateien
werden im Produktions-Build vorgemerkt; bei älteren Browsern muss die Codec-Unterstützung
am Zielgerät geprüft werden. Fehlendes oder defektes Audio erzeugt einen sichtbaren Hinweis.

`useRecorder` prüft unterstützte Formate zur Laufzeit, begrenzt auf zwölf Sekunden und gibt
Mikrofonspuren bei Ende, Fehler, verborgenem Tab und Unmount frei. Auch eine verspätete
Berechtigungsantwort nach dem Verlassen der Ansicht beendet ihre Spuren. Eigene Aufnahmen
bleiben flüchtig im Browser; Object-URLs werden beim Ersetzen und Unmount freigegeben.
Vor Aufnahmebeginn und bei Audio-Wiedergabe werden andere Audioelemente angehalten;
Vorbild-Wiedergabe ist während der Aufnahme gesperrt.

## Optionale Erkennung

`api/check-pronunciation.ts` exportiert den Vercel-Web-Handler `{ fetch }`.
Der lokale Vite-Adapter in `scripts/vite-api.ts` verwendet denselben Handler.
Aufnahmen werden nur nach explizitem Klick übertragen. Ohne Schlüssel kommt eine verständliche
Fehlermeldung; Selbstbewertung bleibt möglich.

Whisper-Transkription plus vorhandener Konsonanten-/Langvokalvergleich ist eine heuristische
Erkennung des Zielausdrucks. Sie kann bei ähnlichen Wörtern und Kurzvokalen irren.
Das UI zeigt deshalb keine scheinpräzise Aussprachepunktzahl und übernimmt das Ergebnis
nicht automatisch ins Lernintervall. Rohtranskripte werden nicht protokolliert.
Das serverseitige Limit beträgt 3 MiB Audio; Requests und Antwortzeiten sind begrenzt.
Server und Skripte werden im TypeScript-Build mitgeprüft.

Referenzen: [Vercel Node-Web-Handler](https://vercel.com/docs/functions/runtimes/node-js),
[Vite PWA Precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache).

## Inhalte und Grenzen

Persische Schrift bleibt aus Wortschatz und UI ausgeschlossen; TTS-Eingaben sind build-intern.
Bestehende Quellenkennzeichnungen wurden übernommen, nicht pauschal neu als geprüft bestätigt.
Ein unsicherer Eintrag wird nicht automatisch neu eingeführt. Der vollständige Audio- und
Dialogkurs, ein Backup-Import sowie echte Geräte- und Cloud-Tests sind noch offen.
