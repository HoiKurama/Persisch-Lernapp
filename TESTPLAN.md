# Prüfstand · 2026-09-16

## Automatisch bestätigt

- Produktions-Build erfolgreich; TypeScript prüft auch API und Skripte.
- 71 Tests in zwölf Dateien bestanden: SM-2, Vokabelschema, Schrift-Guard, Migration,
  getrennte Fähigkeiten, Intervallschutz, Sitzungsbegrenzung, eindeutige Antwortoptionen,
  Lösungshilfe/Selbstbewertung, verspätete Mikrofonfreigabe, doppelte Aufnahmeanfragen,
  API-Vertrag und fehlender Cloud-Schlüssel. Zusätzlich: vollständiges Hören vor Abschluss
  einer Lernphase, kein Fortschritt beim Kennenlernen, Überspringen ohne spätere Abfrage,
  Fehler-Wiederholung ohne zweite Lernnote, Schutz vor verspäteten Sitzungsantworten,
  Rollenübungen mit bestehenden bestätigten Einträgen und reale Audio-Dateien mit Nachweisen.
- `npm run lint`: keine Fehler oder Warnungen.
- `npm run validate-vocab`: 287 Einträge in neun Dateien, kein unerlaubtes Schriftsystem.
- PWA-Produktions-Build: 44 vorgemerkte Dateien inklusive 29 lokaler Hörbeispiele (ca. 3,0 MiB).

## Im Desktop-Browser bestätigt

- Startseite zeigt Tagesziel und Audioabdeckung (29/287).
- Hörübung: Bedeutungsauswahl zunächst gesperrt; echte Wiedergabe aktiviert die Auswahl;
  richtige Antwort zeigt Bedeutung und Lautschrift.
- Wortsuche filtert passende Einträge.
- Sprechansicht hält die Lösung zunächst verborgen.
- Alltagssituationen: Auswahl und deutscher Kontext mit zunächst verborgener Antwort geprüft.
- Neue Wasser-Aufnahme vollständig abgespielt: Nachsprech-Schritt wird erst danach aktiviert.
  Weiter führt zum nächsten Ausdruck; dessen Nachsprech-Schritt ist wieder gesperrt.
- Smartphone-Breite 390px: Navigation, Texte und Bedienelemente ohne sichtbares Abschneiden.
- Normale Vorschaugröße nach dem Test wiederhergestellt.
- Produktionsvorschau: bestehende Referenzaufnahme und die neu importierte Aufnahme `bozorg`
  vollständig geladen und ohne Medienfehler abgespielt. Der verwendete In-App-Browser stellt
  keinen Service Worker bereit; ein Ende-zu-Ende-Offlinetest erfordert daher weiter ein Zielgerät.

## Noch auf dem echten Zielgerät zu prüfen

- [ ] Safari/iPhone/iPad: Mikrofon erlauben, verweigern und erneut versuchen.
- [ ] Aufnahme beenden, nach zwölf Sekunden automatisch beenden, Wiedergabe vergleichen.
- [ ] App während einer Aufnahme verlassen: Mikrofon wird freigegeben.
- [ ] WAV- und OGG-Hörbeispiele auf der konkreten Safari-Version abspielen.
- [ ] Produktions-App installieren, vollständig laden, offline neu öffnen und Audio abspielen.
- [ ] Fortschritt nach Browser-Neustart erhalten; Sicherungsdatei herunterladen.
- [ ] Nach optionaler Einrichtung: echte Erkennung mit korrekter/falscher/leerer Aufnahme,
      Netzverlust und langsamem Server. Technische Fehler dürfen keine automatische Note erzeugen.

Die Inhalte wurden in diesem Umbau nicht vollständig sprachlich neu geprüft.
Für einen vollständigen Audiokurs fehlen 258 Aufnahmen sowie vertonte Dialoge.
Letzte zwei Commons-Läufe: sieben neue Dateien erfolgreich; sechs Kandidaten weiterhin
temporär nicht abrufbar.
