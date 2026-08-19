# Offerte: AOZ Begleitung — Integrationsplattform fuer Fachpersonen

**Für** AOZ (Asyl-Organisation Zürich)
**Von** Georgy Butaev, Zürich
**Datum** 15. August 2026  
**Zuletzt angepasst** 19. August 2026 — Reframing fuer Montag: AOZ Begleitung, Vier-Pfeiler-Narrativ, breitere Fachpersonen-Sicht.  
**Gültig bis** 14. Oktober 2026
**Referenz** AOZ-WOHNEN-2026-01

> **Hinweis vor dem Versand:** Firmierung, Adresse, UID/MwSt-Nummer und Bankverbindung
> sind noch einzusetzen (Abschnitt 13). Ohne diese Angaben ist das Dokument eine
> Arbeitsversion, keine rechtsgültige Offerte.

---

## 1. Zusammenfassung

AOZ braucht nicht nur ein besseres Platzierungswerkzeug, sondern eine
**gemeinsame Arbeitsflaeche fuer Fachpersonen**. Housing-Stabilitaet,
Sprach- und Lernfortschritt, Arbeitsmarktnaehe, Teilhabe und koordinierte
Begleitung duerfen nicht in getrennten Sichten stecken bleiben.

Das System ist **bereits gebaut und laeuft**. Es verbindet:

- erklaerbares Matching und Platzierung
- Housing-, Vorfall- und Transferprozesse
- Integrations-Evidenz fuer Sprache, Kurse, Qualifikationen und Freiwilligenarbeit
- rollenfoermige Sichten fuer Leitung, Betreuung, Sozialarbeit und Jobcoach
- ein mehrsprachiges Portal fuer Klient*innen

Diese Offerte betrifft nicht die Entwicklung eines Prototyps, sondern die
**Einfuehrung, den Betrieb und die gezielte Weiterentwicklung** eines bereits
funktionsfaehigen Produkts.

| | |
| --- | --- |
| **Pilot** (3 Monate, bis 2 Standorte) | **CHF 9'950** einmalig |
| **Betrieb** ab Monat 4 (bis 3 Standorte) | **CHF 650** pro Monat |
| **Alternative: Übernahme** (Quellcode, unbefristet) | **CHF 45'000** einmalig |

Alle Preise in Schweizer Franken, exkl. MwSt.

---

## 2. Ausgangslage

Bei der Platzierung in Gemeinschaftsunterkuenften entstehen wiederkehrend
Konflikte aus Unvertraeglichkeiten, die bei der Zuteilung sichtbar gewesen
waeren:

- unterschiedliche Schlafrhythmen
- unterschiedliche Lärmtoleranz und Sauberkeitsstandards
- Rauchende in Nichtraucherzimmern
- fehlende gemeinsame Sprache im Zimmer
- Mobilitätsbedarf ohne passende Unterkunft

Jeder dieser Konflikte bindet Personalzeit fuer Schlichtung und, im schlechteren
Fall, fuer einen Umzug.

Gleichzeitig endet die operative Realitaet nicht bei der Platzierung. AOZ muss
auch sehen:

- wie stabil eine Unterbringung bleibt
- welche Rueckmeldungen von Klient*innen offen sind
- welche Integrationsschritte bereits sichtbar sind
- wo Sozialarbeit und Jobcoach naechste Schritte brauchen

**Wichtig:** Wie hoch diese Kosten bei AOZ tatsächlich sind, ist heute nicht gemessen.
Diese Offerte behauptet keine Einsparung. Sie schlägt vor, sie zuerst zu messen
(Abschnitt 8).

---

## 3. Leistungsumfang — was heute bereits funktioniert

Das System ist kein Prototyp. Folgende Funktionen sind implementiert, getestet und im
Betrieb:

### Stability - Platzierung und Kompatibilitaet

- Kompatibilitätsberechnung über **4 Dimensionen** (Lebensstil 30 %, Sozial 25 %,
  Praktisch 25 %, Risiko 20 %) und 38 Faktoren
- Bewertung nicht nur paarweise, sondern gegen die **gesamte bestehende Gruppe** einer
  Wohneinheit
- **Blockierende Konflikte** werden erkannt und verhindern die Platzierung (z. B.
  Rauchende in Nichtraucherzimmer, Rollstuhl ohne barrierefreien Zugang)
- 5-stufige Bewertungsskala mit klarer Handlungsempfehlung (Sehr gut / Gut / Mittel /
  Niedrig / Kritisch)
- **Das System empfiehlt, der Mensch entscheidet.** Übersteuerungen sind jederzeit
  möglich und werden mit Begründung protokolliert.

### Stability - Betrieb der Unterkuenfte

- Verwaltung von Bewohnenden, Unterkünften, Zimmern und Betten
- Platzierungshistorie mit Ein- und Auszug
- Vorfallerfassung (Konflikte) inkl. Schweregrad und Verlauf
- Unterhalt/Reparaturmeldungen mit Ticketstatus
- Umzugsanträge mit Freigabe-Warteschlange für Mitarbeitende
- Ämtli-/Aufgabenverwaltung

### Capability, Participation und Guidance

- Vier Mitarbeitenden-Rollen: **Leitung**, **Betreuung**, **Sozialarbeit**, **Jobcoach**
  (in der Datenbank bleibt Leitung `ADMIN`, damit bestehende Zugaenge weiterlaufen)
- Lernprofil pro Bewohner:in: Sprachtests, Kurse, informelles Lernen,
  Abschluesse, Freiwilligenarbeit und weitere Integrations-Evidenz
- rollenfoermige Boards fuer Integrations-Evidenz mit Filtern fuer eigene
  Klient*innen, Status, Quelle und Kategorie
- Care Team mit sichtbaren Zustaendigkeiten, Nachrichten und Follow-ups

### Betriebsfaehigkeit

- Zufriedenheitserfassung
- CSV-Import und -Export fuer alle zentralen Datenbestaende
- nachvollziehbare Rollentrennung
- mobile Bedienbarkeit und produktionsnahe Demo-Umgebung

### Bewohnendenportal (Selbstbedienung)

- Eigenes Profil und eigene Präferenzen einsehen und ändern
- Aktuelle Mitbewohnende sehen
- Anliegen melden — geht in die Warteschlange der Mitarbeitenden
- Umzug beantragen
- Ämtli einsehen und übernehmen
- Hilfe/FAQ in Deutsch, Englisch, Französisch, Arabisch, Farsi/Dari, Tigrinya u. a.
- Lernprofil und Integrations-Evidenz selbst pflegen

Bewohnende sehen ausschliesslich **ihre eigenen Daten**. Alle folgenreichen Aktionen
laufen über die Freigabe der Mitarbeitenden.

### Zugang und Nachvollziehbarkeit

- Anmeldung mit **Zugangscode** (Standard auf der AOZ-Fläche) oder mit
  E-Mail und Passwort — beides bleibt verfügbar. Bewohnende brauchen keine
  E-Mail-Adresse.
- Rate-Limiting gegen Code-Erraten
- **Vollständiger Audit-Trail**: Wer hat wann welche Platzierung vorgenommen, mit welchem
  Kompatibilitätswert, und mit welcher Begründung bei Übersteuerung
- Automatische Benachrichtigungen (E-Mail) über einen täglichen Job

### Bedienung

- Verbindliche Hausordnung auf **Deutsch**; Portal-Chrome übersetzt
- **Mobile-First**: bedienbar auf dem Mobiltelefon ab 375 px Breite, Touch-Ziele ≥ 44 px
- Hell- und Dunkelmodus
- Auf Barrierefreiheit und Tastaturbedienung getestet
- Keine Installation, keine neue Hardware — es ist eine Webseite

---

## 4. Betriebsvarianten

Der Ort der Datenhaltung ist bei Personendaten von Asylsuchenden die wichtigste
Einzelentscheidung. Drei Varianten stehen zur Wahl:

| Variante | Datenhaltung | Auswirkung auf den Preis |
| --- | --- | --- |
| **A — Schweizer Rechenzentrum** *(empfohlen)* | Betrieb durch mich bei einem Schweizer Anbieter (z. B. Infomaniak, Exoscale), Daten verlassen die Schweiz nicht | im Preis enthalten |
| **B — On-Premise bei AOZ** | Betrieb auf AOZ-eigener Infrastruktur, vollständige Datenhoheit bei AOZ | Einrichtung + CHF 3'500, Betrieb − CHF 150/Monat |
| **C — Bestehende EU-Infrastruktur** | Betrieb auf meiner bestehenden Infrastruktur in Deutschland | Betrieb − CHF 100/Monat, **benötigt Freigabe der Datenschutzstelle** |

**Empfehlung: Variante A.** Der Preisunterschied zu C ist gering, der Aufwand für die
datenschutzrechtliche Abklärung entfällt, und die Frage „wo liegen die Daten" hat eine
Antwort, die in jeder Sitzung trägt.

---

## 5. Datenschutz und Compliance

### Rollenverteilung

AOZ ist verantwortliches Organ für die Datenbearbeitung. Ich handle als
**Auftragsbearbeiter**. Ein Auftragsbearbeitungsvertrag (AVV) ist Bestandteil dieser
Offerte und wird vor der ersten Datenerfassung unterzeichnet.

Anwendbar sind das revidierte Datenschutzgesetz des Bundes (revDSG) sowie das
Informations- und Datenschutzgesetz des Kantons Zürich (IDG). Die abschliessende
datenschutzrechtliche Beurteilung obliegt der Datenschutzstelle von AOZ; ich liefere
die Unterlagen dafür zu und setze Auflagen um.

### Datenminimierung — was das System bewusst NICHT erfasst

Diese Grenze ist im System selbst verankert, nicht nur in einer Richtlinie:

- **keine** medizinischen Diagnosen (nur funktionale Bedürfnisse, z. B. „benötigt Erdgeschoss")
- **keine** Angaben zum Asylstatus oder zum Verfahren
- **keine** religiösen oder politischen Angaben
- **keine** persönliche Vorgeschichte über die Wohnrelevanz hinaus
- **nichts**, was zur Diskriminierung verwendet werden könnte

Erfasst werden ausschliesslich: Schlafrhythmus, Lärmtoleranz, Sauberkeitsanspruch,
Rauchstatus, gesprochene Sprachen, Mobilitätsbedarf sowie anonymisierte Konfliktausgänge.

### Im Preis enthaltene Datenschutzleistungen

- Auftragsbearbeitungsvertrag (AVV)
- Beitrag zum Bearbeitungsverzeichnis von AOZ
- Löschkonzept mit definierten Aufbewahrungsfristen
- Technisches und organisatorisches Massnahmenkonzept (TOM)
- Zuarbeit für eine Datenschutz-Folgenabschätzung (DSFA), falls die Datenschutzstelle
  eine verlangt
- Verschlüsselung im Transport (TLS) und im Ruhezustand; Zugriffsprotokollierung
- Nachvollziehbarkeit jeder algorithmischen Empfehlung — **keine Blackbox.** Jeder
  Kompatibilitätswert lässt sich auf die einzelnen Faktoren herunterbrechen und
  gegenüber Bewohnenden begründen.

---

## 6. Preise

### 6.1 Variante A — Pilot und Betrieb *(empfohlen)*

**Phase 1: Einrichtung und Pilot (3 Monate, bis 2 Standorte)**

| Position | Beschreibung | Preis |
| --- | --- | --- |
| Einrichtung | Instanz aufsetzen, Standorte/Zimmer/Betten konfigurieren, bestehende Daten importieren, Zugangscodes ausstellen | CHF 4'200 |
| Schulung | 2 Termine à 2 Stunden vor Ort, plus schriftliche Kurzanleitung auf Deutsch | CHF 1'400 |
| Begleitung Baseline | Unterstützung bei der Erhebung der Ausgangswerte im Monat 0 (Abschnitt 8) | CHF 800 |
| Pilotbetrieb | 3 Monate Hosting, Backup, Support, inkl. 10 Stunden Anpassungen aus dem Pilotfeedback | CHF 1'950 |
| Auswertung | Schriftlicher Auswertungsbericht Baseline vs. Pilot, mit Empfehlung zum weiteren Vorgehen | CHF 1'600 |
| **Total Phase 1** | | **CHF 9'950** |

**Phase 2: Betrieb ab Monat 4**

| Umfang | Preis pro Monat |
| --- | --- |
| bis 3 Standorte | CHF 650 |
| 4 bis 10 Standorte | CHF 1'150 |
| ab 11 Standorten | nach Absprache |

Im Betrieb enthalten:

- Hosting in einem Schweizer Rechenzentrum
- tägliche Sicherung, 30 Tage Aufbewahrung, halbjährlich getestete Wiederherstellung
- Sicherheitsaktualisierungen und Abhängigkeits-Updates
- Überwachung der Verfügbarkeit mit Alarmierung
- Support per E-Mail, Reaktionszeit 1 Arbeitstag
- bis 2 Stunden kleinere Anpassungen pro Monat (nicht kumulierbar)

Kündigungsfrist 3 Monate auf Monatsende. Keine Mindestlaufzeit über den Pilot hinaus.

### 6.2 Variante B — Übernahme

Falls AOZ das System vollständig übernehmen möchte:

| Position | Preis |
| --- | --- |
| Zeitlich unbefristete Lizenz, Quellcode, Dokumentation, Übergabe an die AOZ-Informatik | CHF 45'000 einmalig |
| Einführung und Schulung | CHF 4'800 einmalig |
| Optionale Wartung (Sicherheitsupdates, Support) | CHF 450 pro Monat |

Zum Vergleich: Eine Neuentwicklung dieses Funktionsumfangs entspricht erfahrungsgemäss
6 bis 12 Personenmonaten.

### 6.3 Weiterentwicklung

| Position | Preis |
| --- | --- |
| Stundensatz | CHF 145 |
| Kontingent 10 Stunden | CHF 1'350 |
| Kontingent 25 Stunden | CHF 3'250 |

Kontingente sind 12 Monate gültig. Jede Anpassung über 4 Stunden wird vorher schriftlich
geschätzt und freigegeben.

---

## 7. Nicht enthalten

Damit es später keine Diskussion gibt:

- Erfassung von Bestandsdaten durch mich (CSV-Import ist enthalten, das Ausfüllen nicht)
- Schulungen über die zwei offerierten Termine hinaus
- Anbindung an bestehende AOZ-Fachanwendungen — technisch möglich, separate Offerte
- 24/7-Pikettdienst (Support Mo–Fr, Reaktionszeit 1 Arbeitstag)
- Hardware und Endgeräte
- Übersetzungen der Oberfläche in weitere Sprachen

---

## 8. Wirtschaftlichkeit — Annahmen, die der Pilot prüfen soll

Die folgende Rechnung ist eine **Annahme**, keine Messung. Genau deshalb beginnt der
Pilot mit einem Monat Baseline-Erhebung ohne System.

**Angenommene Ausgangslage, Unterkunft mit 50 Plätzen:**

| Kennzahl | Annahme | Aufwand |
| --- | --- | --- |
| Konflikte mit Schlichtung | 15 pro Monat | 15 Std. |
| Umzüge wegen Unverträglichkeit | 4 pro Monat | 8 Std. |
| **Total** | | **23 Std. pro Monat** |

**Was gemessen wird — vor und während des Pilots, identisch:**

| Kennzahl | Zielrichtung |
| --- | --- |
| Konflikte pro Monat | − 30 % |
| Umzüge wegen Unverträglichkeit | − 50 % |
| Personalstunden für Schlichtung | − 40 % |
| Zeit bis zur Platzierung | nicht länger als heute |

Träfen diese Ziele zu, entspräche das rund 9 eingesparten Personalstunden pro Monat und
Standort. Ob sie zutreffen, weiss nach dem Pilot niemand mehr aus dem Bauch heraus,
sondern aus den eigenen Zahlen von AOZ.

**Wenn sich die Kennzahlen nicht verbessern, ist das ein gültiges Ergebnis.** Der
Auswertungsbericht sagt es dann so, und AOZ entscheidet ohne laufende Verpflichtung.

---

## 9. Qualitätsnachweis

Was diese Software von einem Prototyp unterscheidet:

| | |
| --- | --- |
| Automatisierte Tests (Unit) | 2'341 in 135 Suiten |
| Automatisierte Tests (End-to-End) | 173 in 18 Szenarien |
| Prüfung vor jeder Änderung | Jede Änderung läuft über eine automatische Prüfstrecke (Codeprüfung, Typprüfung, alle Tests). Ohne grüne Prüfstrecke gelangt nichts in den Betrieb. |
| Getestete Bereiche | Kompatibilitätsalgorithmus, Zugangskontrolle, Rollentrennung Portal/Verwaltung, Import/Export, Benachrichtigungen, mobile Darstellung, Barrierefreiheit |
| Audit-Trail | Jede Platzierung protokolliert mit Person, Zeitpunkt, Kompatibilitätswert und Begründung |

---

## 10. Kein Vendor-Lock-in

Eine berechtigte Sorge bei einem Einzelanbieter. Deshalb ausdrücklich zugesichert:

- **Datenexport jederzeit**, vollständig, im offenen CSV-Format — nicht auf Anfrage,
  sondern als Funktion in der Oberfläche
- **Quellcode-Hinterlegung**: Auf Wunsch wird der Quellcode bei einem Treuhänder
  hinterlegt oder AOZ erhält Lesezugriff auf das Repository
- **Übernahmerecht**: AOZ kann jederzeit zu Variante B wechseln; bereits bezahlte
  Betriebsentgelte der letzten 12 Monate werden angerechnet
- Standardtechnologien (PostgreSQL, TypeScript, Next.js) — kein proprietäres Format,
  keine exotische Abhängigkeit

---

## 11. Zeitplan

| Woche | Schritt |
| --- | --- |
| 0 | Demo (30 Minuten), Klärung offener Fragen |
| 1–2 | AVV unterzeichnet, Datenschutzstelle informiert, Betriebsvariante gewählt |
| 3 | Einrichtung, Datenimport, Zugangscodes |
| 4 | Schulung, Start Baseline-Erhebung |
| 5–8 | Baseline (noch ohne System) |
| 9–20 | Pilotbetrieb an 1–2 Standorten |
| 21 | Auswertungsbericht und Entscheid |

---

## 12. Was ich von AOZ benötige

1. **Eine Ansprechperson** mit Entscheidungskompetenz
2. **1–2 Pilotstandorte**
3. **Baseline-Daten**: aktuelle Konflikt- und Umzugszahlen (Erfassung wird begleitet)
4. **Rückmeldung der Mitarbeitenden** während des Pilots
5. **Kontakt zur Datenschutzstelle** für die Freigabe

---

## 13. Noch einzusetzen vor dem Versand

| Feld | Wert |
| --- | --- |
| Firmierung / Rechtsform | *(Einzelfirma oder GmbH?)* |
| Adresse | |
| UID / MwSt-Nummer | *(falls mehrwertsteuerpflichtig)* |
| Bankverbindung / IBAN | |
| Zahlungskonditionen | Vorschlag: 30 Tage netto, Phase 1 hälftig bei Auftrag und bei Abnahme |

---

## 14. Nächster Schritt

**Eine Demo von 30 Minuten.** Das System wird am echten Ablauf gezeigt: Aufnahme einer
Person, Platzierungsvorschlag, Warnung bei blockierendem Konflikt, Protokolleintrag.

Danach entscheidet AOZ, ob ein Pilot Sinn ergibt — ohne Verpflichtung.

---

*Diese Offerte enthält keine Rechtsberatung. Die datenschutzrechtliche Beurteilung
obliegt der zuständigen Stelle von AOZ.*
