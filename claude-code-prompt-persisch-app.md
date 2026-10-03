# Claude Code Prompt: Persisch-Lernapp

> Diesen Text als erste Nachricht in Claude Code einfügen (idealerweise in einem leeren Projektordner).

---

## Kontext

Ich bin Lehrer und möchte Persisch (Farsi) sprechen lernen – **nicht** lesen oder schreiben. Ich habe keine passende App gefunden und will deshalb eine eigene bauen. Die App soll zunächst als Web-Prototyp laufen, später aber auf meinem Handy und iPad nutzbar sein, ohne dass ich sie über einen App Store vertreiben muss.

## Muss-Anforderungen (nicht verhandelbar)

1. **Keine arabische Schrift.** Persische Wörter werden ausschließlich in Lautschrift/Transliteration angezeigt (z. B. „salâm" statt سلام).
2. **Aktives Sprechtraining mit Feedback.** Ich will nicht nur Audio hören und nachsprechen – die App soll meine Aufnahme mit der korrekten Aussprache vergleichen und mir eine Rückmeldung geben (richtig/falsch bzw. wo ich abweiche).
3. **Vokabeltrainer mit Spaced Repetition** (z. B. SM-2-Algorithmus oder vergleichbar), damit Wiederholung sich an meinen Lernfortschritt anpasst.
4. **Später mobil nutzbar** auf iPhone/iPad, ohne App-Store-Review-Prozess.
5. **Sprachdaten müssen stimmen.** Persisch-Vokabular, Transliteration und Aussprachereferenzen dürfen nicht halluziniert werden. Nutze etablierte Quellen (z. B. anerkannte Persisch-Wörterbücher/Lehrwerke) und kennzeichne im Code/README, woher die initiale Wortliste stammt. Wenn du dir bei einer Übersetzung oder Umschrift unsicher bist, kennzeichne den Eintrag statt ihn zu erfinden.

## Technische Leitplanke – bitte zuerst klären

Bevor du mit dem Code anfängst: Recherchiere und entscheide aktiv zwischen zwei Architektur-Optionen und dokumentiere die Entscheidung in einer `ARCHITECTURE.md`:

- **Option A – PWA (Progressive Web App):** Ein Code-Stand, installierbar auf iOS/Android über „Zum Home-Bildschirm hinzufügen", kein App Store nötig. Risiko: Web Speech API (browserseitige Spracherkennung) ist in Safari/iOS unzuverlässig bis nicht verfügbar.
- **Option B – Serverseitige Spracherkennung:** Audioaufnahme im Browser, Übertragung an eine STT-API (z. B. Whisper-basiert) zur Auswertung. Funktioniert plattformunabhängig, verursacht aber laufende API-Kosten pro Aufnahme und braucht ein Backend.

Meine Präferenz: Baue es so, dass die Ausspracheprüfung **nicht** von der Web Speech API abhängt, damit es auf dem iPad zuverlässig funktioniert – nutze stattdessen serverseitige Verarbeitung. Wenn du eine bessere/günstigere Lösung kennst, schlage sie vor und begründe sie, statt sie einfach stillschweigend umzusetzen.

## Kernfunktionen

- Vokabelkategorien (Alltag, Reisen, Small Talk o. ä. – schlage eine sinnvolle Struktur vor)
- Karteikarten-Modus: Lautschrift + Bedeutung + Audio-Beispiel eines Muttersprachlers/TTS
- Aufnahme-Modus: ich spreche das Wort/den Satz, die App bewertet die Aussprache und zeigt konkret, was ich üben sollte
- Fortschrittstracking pro Vokabel (spaced repetition), sichtbar in einer einfachen Statistik
- Reine Mobile-First-Oberfläche, große Touch-Targets, auch für iPad-Nutzung gut lesbar

## Vorgehen – nutze Subagents und Plan Mode gezielt

1. Starte im **Plan Mode**, erstelle eine `PLAN.md` mit Architekturentscheidung, Datenmodell und Meilensteinen, bevor du Code schreibst. Frag mich über das AskUserQuestion-Tool nach offenen Entscheidungen (z. B. Umfang der ersten Wortliste, Design-Vorlieben).
2. Lege für klar abgrenzbare, parallelisierbare Teilaufgaben eigene Subagents an (`.claude/agents/`), z. B.:
   - **content-curator**: recherchiert und pflegt die Persisch-Vokabeldaten inkl. Transliteration und Quellenangabe (Read/Write/WebSearch, kein Code-Schreibzugriff auf die App-Logik)
   - **speech-pipeline-engineer**: baut die Aufnahme- und Auswertungslogik (Backend/API-Anbindung)
   - **ui-builder**: baut die mobile-first Oberfläche und PWA-Konfiguration (Manifest, Service Worker)
   - **qa-tester**: schreibt und führt Tests aus, prüft insbesondere, dass keine arabische Schrift irgendwo im UI auftaucht und dass die Spaced-Repetition-Logik korrekt rechnet
3. Nutze die Subagents parallel, wo die Aufgaben unabhängig sind, statt alles sequenziell im Hauptkontext zu erledigen.
4. Committe in sinnvollen Schritten, damit ich den Fortschritt nachvollziehen kann.

## Qualitätssicherung

- Tests für die Spaced-Repetition-Logik (z. B. korrekte Intervall-Berechnung)
- Manuelle Prüfliste in `TESTPLAN.md`: Funktioniert Aufnahme + Feedback auf einem echten iPad/iPhone (Safari)?
- Kurzer Hinweis im README, welche laufenden Kosten (API-Aufrufe für Sprachverarbeitung) bei intensiver Nutzung realistisch entstehen

## Liefergegenstand

- Lauffähiger Prototyp lokal startbar
- `README.md` mit: Setup-Anleitung, Deploy-Anleitung (z. B. Vercel/Netlify) und Schritt-für-Schritt-Anleitung, wie ich die App auf iPhone/iPad zum Home-Bildschirm hinzufüge
- `ARCHITECTURE.md` mit der begründeten Architekturentscheidung
- Quellenangabe zur initialen Vokabeldatenbank
