# Worauf die KI-Reviews achten

Anweisungen für das Codex-Review (`.github/workflows/codex-review.yml`, Einrichtung in `docs/ki-review.md` von website-astro). Der Workflow ist in website-astro, playwright-api und hier gleich; was nur für dieses Repo gilt, steht hier.

## Projekt

Der Leitendenbereich von DPSG Stamm Phoenix als eigene App: SvelteKit 3, Svelte 5 Runes, Tailwind CSS 4, adapter-node in Azure Container Apps. Die öffentliche Website ist das Submodul `vendor/website-astro`; diese App importiert deren Code (`#legacy/…`) und bedient `/api/*` mit deren Endpunkten. Das Submodul ist im Review nicht ausgecheckt: Prüfe nur den Diff dieses Repos. Ein geänderter Zeiger auf das Submodul steht im Diff als `Subproject commit`.

## Regeln

Kurzfassung von `AGENTS.md`:

- Code aus website-astro wird mit `#legacy/…` importiert, nie kopiert; eigener Code ist `#lib/…`. Änderungen an gemeinsamem Code und neue Endpunkte gehören in website-astro, nicht hierher.
- In website-astro wird nichts gelöscht, solange der Leitendenbereich umzieht.
- Abhängigkeiten, die Code des Submoduls nutzt, haben genau die Versionen aus `vendor/website-astro/web/package.json` und `vendor/website-astro/api/package.json`.
- Werte stehen in `APP_CONFIG` (`src/lib/server/config.ts`); aus der Umgebung kommen nur Geheimnisse und Schalter (`src/lib/server/env.ts`). Keine Umgebungsvariable, die einen Konfigurationswert überschreibt.
- Timer laufen nur als Container Apps Jobs, nie im Webserver, ohne `runOnStartup` und ohne Wiederholung.

## Besonders prüfen

- `hooks.server.ts` und der Login: Ein `x-ms-client-principal` aus der Anfrage wird nie geglaubt; `/leitendenbereich/*` und `/api/intern/*` brauchen die Rolle `team_leitende`.
- Vorschauen: Eine Revision von `main` bekommt nie `PREVIEW_DATABASE` oder `PREVIEW_CONTAINER`; Vorschauen starten keine Timer und keinen Neuaufbau der Website.
- Timer laufen nur als Container Apps Jobs, ohne `runOnStartup` und ohne Wiederholung, damit keine Mail doppelt rausgeht.
- Ein geänderter Zeiger auf das Submodul kommt mit angeglichenen Versionen der Abhängigkeiten (`test/dependencies.test.ts`).
- Workflows: PRs aus Forks bekommen keine Secrets und keine OIDC-Anmeldung bei Azure; Rechte so knapp wie möglich.
- Texte im Leitendenbereich: einfache Sprache in der Du-Form, Fehlermeldungen mit nächstem Schritt, keine erklärenden Sätze („Usability for Leitende“).
- Barrierefreiheit: `aria-labelledby`, `width`/`height` an Bildern, ARIA an interaktiven Elementen, Touch-Ziele ab 44 px.
- Änderungen, die Leitende bemerken, nennen im PR den Eintrag in den Neuigkeiten von website-astro oder warum keiner nötig ist.

## Hinweise

`hinweis` sind z. B. Verstöße gegen `AGENTS.md`, Barrierefreiheit, Wortwahl und kleine Risiken.

## Bereiche

Sicherheit, Funktion, Daten, Barrierefreiheit, Usability, Projektregeln, Performance, Betrieb
