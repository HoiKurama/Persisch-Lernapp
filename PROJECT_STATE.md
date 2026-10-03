# Goal

Stand: 2026-09-16. Persönliche Lernapp für gesprochenes iranisches Persisch optimieren.
Nur verstehen und sprechen; keine Schreibübungen, Lautschrift optional.
Erfolgskriterium: kurze nutzbare Einheiten, getrennte Fähigkeiten, erhaltener Fortschritt
und transparente Inhaltslücken.

# Current State

React/TypeScript/Vite/Dexie/PWA überarbeitet: Heute, Hören, Sprechen, Wortschatz,
Fortschritt. Tagesziel; Audio vor Bedeutungswahl; verborgene Sprechlösung, lokale Aufnahme
und Wiedergabe; Wortschatzsuche statt Lesekarten. Neue vertonte Ausdrücke zuerst vollständig
hören und nachsprechen, anschließend abrufen. Drei Rollenübungen: Kennenlernen,
Höflichkeit, Verständigung. 287 Einträge, neun Themen, 29 lokale Originalaufnahmen.

Bestätigt: 71 Tests/zwölf Dateien, Build inklusive API/Skripten, Lint, Vokabelprüfung.
PWA-Precache: 44 Dateien einschließlich aller Audios, ca. 3,0 MiB. Browser geprüft:
Startseite, echte Audio-Wiedergabe einschließlich neuem `bozorg`, neue Lernphase,
Rollenübung, Suche, 390px-Darstellung. Mikrofon, iOS, Offline-Neustart und echte
Cloud-Erkennung noch ungeprüft.
Nur lokal bearbeitet; kein Deployment oder Cloud-Setup. Zuletzt lokal im Produktionsmodus
geprüft; bei Bedarf `npm run preview -- --host 127.0.0.1 --port 4173` starten.
Git-Arbeitsbaum enthält uncommittete Änderungen; vorhandene Änderungen bewahren.

# Important Decisions

Dexie v2 trennt Hören/Sprechen; Migration aus Review-Logs erhält Altbestand und vergibt
keinen Sprechfortschritt für Lesen. Inhaltsänderungen erhalten Fortschritt.
Regulär maximal zehn Abfragen/fünf neue Ausdrücke, fällige zuerst; Lernschritte zusätzlich
ohne Lernnote. Fehler einmal zusätzlich ohne zweites Protokollereignis, nach zehn Minuten
wieder fällig. Mehrfache Erfolge am selben Tag verlängern Intervalle nicht.
Sprechen startet mit vertonten Einträgen, weitere zuschaltbar. Rollenübungen behalten die
Gesprächsfolge und nutzen dieselben Sprechintervalle. Selbstbewertung steuert Fortschritt;
eine gezeigte Lösung verhindert eine selbstständige Erfolgsnote. Cloud-Erkennung freiwillig,
nur grobe Zusatzinformation, Übertragung erst nach explizitem Klick.

# Relevant Facts

Nutzer bestätigt: Azure nicht eingerichtet; geprüfte TTS-Eingaben fehlen. 258 Ausdrücke
ohne Audio. Zwei erneute Commons-Läufe importierten sieben Aufnahmen; sechs CC0-Kandidaten
sind trotz Wiederholung temporär nicht abrufbar: `shohar`, `dust`, `hotel`, `kelas`,
`dars`, `emtehan`. Vorhandene Dateien/Nachweise bleiben erhalten. [Lizenzen](content/audio-credits.json),
Kandidaten: `scripts/audio/candidates.ts`. Von 14 Rollenübungs-Schritten sind nur drei
vertont; vollständige Dialogaufnahmen gibt es noch nicht. Keine mehrdeutigen oder abweichenden
literarischen Ersatzformen.
Persische Schrift bleibt aus UI/Wortschatz ausgeschlossen; TTS-Eingaben build-intern.
Bestehende Sprachquellen übernommen, keine vollständige Neuprüfung; ein unsicherer Eintrag
bleibt markiert. Node 24. Prüfungen: `npm run build`, `npm test`, `npm run lint`,
`npm run validate-vocab`. Git umfasst weitere Ordner: Aktionen auf dieses Projekt begrenzen.
Details: [README](README.md), [Architektur](ARCHITECTURE.md), [Testplan](TESTPLAN.md).

# Open Questions

Vollständiger Audiokurs: Anbieter, geprüfte Umgangssprache und vertonte Dialoge offen.
Zielgerät/Hosting verifizieren. Fortschrittsexport vorhanden, Importoberfläche fehlt.

# Next Steps

1. Die sechs weiterhin nicht abrufbaren Commons-Kandidaten später erneut oder manuell gegen
   die Quelle prüfen; die übrigen 35 nicht exakt auffindbaren Kandidaten vor weiteren Läufen
   kuratieren.
2. Alltagssätze/Dialoge mit muttersprachlich bestätigtem Material vertonen und prüfen.
3. Mikrofon und Produktions-PWA offline am Zielgerät prüfen.
4. Bei Bedarf private Bereitstellung, optionale Erkennung und Backup-Import ergänzen.
