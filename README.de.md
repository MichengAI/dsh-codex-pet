<p align="center">
  <img src="assets/branding/dsh-codex-pet-banner.png" alt="DSH Codex Pet" width="100%">
</p>

<div align="center">

# DSH Codex Pet

**Ein kleiner Haustierbegleiter für deine DeepSeek Harness Aufgaben**

[简体中文](README.zh-CN.md) · [English](README.en.md) · [日本語](README.ja.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

[Änderungsprotokoll](CHANGELOG.md) · [Apache-2.0](LICENSE)

[![Lizenz: Apache-2.0](https://img.shields.io/badge/Lizenz-Apache--2.0-blue.svg)](LICENSE)
[![npm package](https://img.shields.io/npm/v/%40michengai%2Fdsh-codex-pet.svg?label=npm%20package)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![npm Downloads](https://img.shields.io/npm/dt/%40michengai%2Fdsh-codex-pet.svg?label=npm%20Downloads)](https://www.npmjs.com/package/@michengai/dsh-codex-pet)
[![DSH Web Plugin](https://img.shields.io/badge/DSH%20Web-Plugin-0f766e.svg)](https://github.com/MichengAI/dsh-codex-pet)
[![Node.js 22.19+](https://img.shields.io/badge/Node.js-22.19%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

> DSH Codex Pet ist ein von der Community gepflegtes Begleiter-Plugin für DeepSeek Harness (DSH), kein offizielles Produkt von OpenAI oder DeepSeek AI. Ab Version 1.0.1 werden DSH `0.2.0-rc.1`, `0.2.0-rc.2`, `0.2.1-rc.1`–`0.2.1-rc.5` sowie `0.2.2-rc.1` unterstützt. Ältere Hosts und `0.2.1`-Alphas werden durch die Versionsprüfung abgewiesen; Einstellungen und eigene Haustiere bleiben dabei erhalten.

## Funktionen

Habe beim Arbeiten in DSH stets einen kleinen Begleiter an deiner Seite, verfolge den Fortschritt laufender Aufgaben und bearbeite Anfragen direkt. Wähle aus 9 integrierten Begleitern oder erstelle mit dem mitgelieferten Skill dein eigenes Haustier.

- **9 integrierte Haustiere**: Wähle deinen Favoriten in den Haustier-Einstellungen und passe die Größe an. Grafik-Assets sind lokal gebündelt.
- **Begleitung im Web**: Begleitet dich direkt auf der DSH-Oberfläche.
- **Multitasking auf einen Blick**: Verfolge laufende Aufgaben, Fehler, fertige Runden und wartende Eingaben. Ohne Benachrichtigungen ist nur das Haustier sichtbar.
- **Direkt reagieren**: Öffne die zugehörige Konversation, halte die aktuelle Runde an oder bearbeite Tool-Genehmigungen und Fragen direkt im Pop-up.
- **Ruhe bei Bedarf**: Verwirf einzelne Erinnerungen, ohne die Aufgabe zu stoppen; blende das Haustier bei Bedarf aus.
- **Eigene Begleiter erschaffen**: Beschreibe das Aussehen in den Einstellungen und starte mit dem `hatch-pet`-Skill eine Erstellungsaufgabe in DSH.
- **Interaktionen**: Ziehen zum Bewegen, Doppelklick zum Hüpfen, Rechtsklick für das Kontextmenü.

## Screenshots

### Aufgaben-Benachrichtigungen

Laufende Aufgaben werden direkt neben dem Haustier angezeigt – mit Schaltflächen zum Öffnen, Anhalten oder Verwerfen.

<p align="center">
  <img src="assets/screenshots/pet-notifications.png" alt="Haustier mit Aufgabenbenachrichtigungen" width="403">
</p>

### Haustier-Einstellungen

Wähle aus den 9 Haustieren, greife auf den Ordner für eigene Kreationen zu und justiere die Größe.

![Bibliothek und Darstellungseinstellungen](assets/screenshots/pet-settings.png)

### Begleiter in der Konversation

Arbeite ungestört in DSH, während Haustier und Statusanzeigen dezent am Bildrand verweilen.

![Haustier und Benachrichtigungen neben DSH-Konversation](assets/screenshots/pet-conversation.png)

## DSH Ökosystem

Für einen vollwertigen Desktop-Arbeitsplatz empfehlen wir [DSH Codex Desktop](https://github.com/MichengAI/dsh-codex-desktop/releases). Bestehende [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)-Installationen können Plugins modular ergänzen:

| Plugin | Einsatzzweck |
| --- | --- |
| [Codex UI](https://github.com/MichengAI/dsh-codex-ui) | Projekt- und Konversationsverwaltung, Aufgabensuche und schnelle Chat-Navigation |
| [Agency Agents](https://github.com/MichengAI/dsh-agency-agents) | Spezialisierte Agenten für Aufgaben auswählen und hinzuziehen |
| [Skills Manager](https://github.com/MichengAI/dsh-skills-manager) | Lokale Skills finden, aktivieren, verfassen und importieren |
| [Archive Manager](https://github.com/MichengAI/dsh-archive-manager) | Archivierte Konversationen durchsuchen, wiederherstellen oder bereinigen |
| [IM Connect](https://github.com/MichengAI/dsh-im-connect) | Aufgaben über Messenger-Dienste steuern und Antworten empfangen |
| [Automation](https://github.com/MichengAI/dsh-automation) | Geplante Aufgaben automatisieren und Ausführungen überwachen |
| [BTW](https://github.com/MichengAI/dsh-btw) | Nebenfragen stellen, ohne den laufenden Hauptkontext zu unterbrechen |
| [Simplify](https://github.com/MichengAI/dsh-simplify) | `/simplify` nutzen, um Code innerhalb von Git-Änderungen gezielt zu verfeinern |
| [PUA](https://github.com/MichengAI/dsh-pua) | Den Agenten nach Fehlern zu neuen Lösungsansätzen und strenger Verifikation anleiten |
| [Code Review](https://github.com/MichengAI/dsh-code-review) | `/review` für unabhängige Code-Reviews durch einen dedizierten Agenten |
| [Codex Pet](https://github.com/MichengAI/dsh-codex-pet) | Aufgabenbenachrichtigungen und Tool-Freigaben über einen Begleiter steuern |

## Installation

Unterstützte DeepSeek Harness Versionen: **`0.2.0-rc.1`**, **`0.2.0-rc.2`**, **`0.2.1-rc.1`–`0.2.1-rc.5`** und **`0.2.2-rc.1`**. Stelle sicher, dass der Befehl `dsh` verfügbar ist:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Starte DSH neu und öffne **Einstellungen → Haustiere** (oder **Settings → Pets**).

## Bedienung

Öffne **Einstellungen → Haustiere** oder nutze das Kontextmenü per Rechtsklick auf den Begleiter.

| Vorhaben | Durchführung |
| --- | --- |
| Begleiter auswählen | Haustier in den Einstellungen auswählen und Größe anpassen. |
| Bewegen & Spielen | Per Maus ziehen; Doppelklick zum Hüpfen. |
| Aufgaben prüfen | Sprechblasen lesen; bei mehreren Aufgaben Liste ausklappen. |
| Konversation öffnen | Auf die Benachrichtigung klicken, um den DSH-Task zu öffnen. |
| Anfrage bearbeiten | Details öffnen und Tool-Genehmigung oder Frage beantworten. |
| Runde abbrechen | Stopp-Symbol in der Benachrichtigung der aktiven Aufgabe anklicken. |
| Benachrichtigung schließen | Schließen-Symbol anklicken (Aufgabe läuft unbeeinflusst weiter). |
| Ein-/Ausblenden | Über das Rechtsklick-Menü oder die Einstellungen umschalten. |

### Eigene Haustiere erstellen

1. Einstellungen öffnen, auf **+** (`Erstellen`) klicken und das Haustier beschreiben.
2. Auf **In DSH erstellen** klicken – eine separate Konversation mit den Skill-Anweisungen öffnet sich.
3. Fortschritt verfolgen (erfordert ein in DSH eingerichtetes Bildgenerierungstool).
4. Nach Fertigstellung die Bibliothek aktualisieren und das neue Haustier auswählen.

## Aktualisierung und Deinstallation

Zur Aktualisierung:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web add @michengai/dsh-codex-pet@latest --registry=https://registry.npmjs.org/ --ignore-scripts
```

Zur Deinstallation:

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

dsh plugin --profile web remove @michengai/dsh-codex-pet
```

Eigene Haustiere werden standardmäßig im Benutzerverzeichnis unter `.dsh/codex-pet/pets` abgelegt und bleiben bei einer Deinstallation erhalten.

## Mitwirken

Hinweise zu lokaler Entwicklung, Tests und Veröffentlichungen findest du im [Entwicklungs- und Verifizierungsleitfaden (Chinesisch)](https://github.com/MichengAI/dsh-codex-pet/blob/main/CONTRIBUTING.md). Sowohl GitHub als auch npm enthalten das ausführbare `lib`-Verzeichnis; führe nach Änderungen am Quellcode vor jedem Commit `npm run build` aus.

## Lizenz

Der Quellcode dieses Plugins steht unter der [Apache License 2.0](LICENSE). Die integrierten Pixel-Art-Grafiken stammen aus OpenAI Codex und sind von der Apache-2.0-Lizenz dieses Projekts ausgenommen; siehe [NOTICE](NOTICE).
