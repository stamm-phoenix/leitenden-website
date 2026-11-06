# AGENTS.md - Leitendenbereich Stamm Phoenix

Guidelines for AI agents working on this SvelteKit 3 + Svelte 5 + Tailwind CSS 4 app: the Leitendenbereich of DPSG Stamm Phoenix as an app of its own (stamm-phoenix/website-astro#526, discussion #524). The public website stays in [website-astro](https://github.com/stamm-phoenix/website-astro).

## Commands

```bash
git submodule update --init     # website-astro in vendor/ (needed for everything below)
bun install                     # Dependencies
bun run dev:mock                # Dev server with the demo API and login of website-astro
bun run dev                     # Dev server against Azure (needs SESSION_SECRET, see „Login“)
bun run check                   # svelte-check of this app (the submodule is checked by website-astro)
bun test                        # Unit tests in test/
bun run build                   # Production build (adapter-node in build/, timer jobs in build/jobs/, PDF worker, see „API“)
```

## How this app is built

```
src/
├── hooks.server.ts         # Every request: login addresses, page protection, /api via the adapter
├── jobs/timer.ts           # Entry of the timer jobs: node build/jobs/timer.js <timer>
├── lib/server/
│   ├── functions/          # Adapter: the Azure Functions endpoints of website-astro, unchanged
│   ├── login.ts            # Entra login (MSAL) under the SWA addresses /.auth/login/aad, /.auth/me, /.auth/logout
│   ├── principal.ts        # The user as SWA describes them, with team roles read from Graph
│   ├── token.ts            # Replaces api/lib/token.ts: Managed Identity instead of the certificate
│   └── deployment.ts       # Replaces api/lib/deployment.ts: preview names from the environment
├── lib/components/         # Svelte ports of Astro components of website-astro (header, footer, …)
├── lib/staffPages.ts       # Pages of the Leitendenbereich that already live here
└── routes/leitendenbereich # The pages; the layout is the port of StaffLayout.astro
vendor/website-astro/       # Submodule: API, components and stores of the website
vite/legacyCode.ts          # Lets the submodule run here (module replacements, __dirname)
scripts/preview-db.ts       # Database and blob container of a PR preview
.github/scripts/            # Deployment to Azure Container Apps, login callbacks of previews
```

### Shared code

- website-astro is a git submodule in `vendor/website-astro`, pinned to a commit. Import its code with `#legacy/…` (subpath import in `package.json`, paths in `tsconfig.json`), e.g. `#legacy/web/src/components/Aufgaben.svelte` or `#legacy/api/lib/config`. Own code is `#lib/…`.
- **Never copy code from website-astro.** Import it. A change to shared code goes to website-astro as a PR there; then move the submodule (`git -C vendor/website-astro checkout <commit>`, commit the new pointer). Only code that is shared long-term between both apps (e.g. UI components) may later move into a package of its own.
- **Do not delete anything in website-astro** while the Leitendenbereich moves. Both run in parallel; the website keeps its Leitendenbereich until this app replaces it.
- Dependencies that code of the submodule uses keep the exact versions of `vendor/website-astro/web/package.json` and `vendor/website-astro/api/package.json`; `test/dependencies.test.ts` checks it. After moving the submodule, align them.
- Components of website-astro listen to Astro's router events. `src/lib/astroTransitions.ts` stands in for `astro:transitions/client`, and `src/lib/astroEvents.ts` fires `astro:before-preparation`, `astro:after-swap` and `astro:page-load` on SvelteKit navigations (the guard against losing unsaved input depends on it).
- An Astro component that this app needs is ported to Svelte in `src/lib/components/` with a comment naming its original. `client:only` islands go into `ClientOnly.svelte`.

### API

- `/api/*` is served by the endpoints of website-astro through `src/lib/server/functions/`: `app.http()` registrations become routes (Functions route templates incl. `{id:int?}` and `{stufe}.ics`), the Fetch request becomes their `HttpRequest`. Do not add endpoints here; add them in website-astro.
- `hooks.server.ts` removes any `x-ms-client-principal` the browser sends and sets the one of the login. Never trust a principal from the request.
- Access as in `staticwebapp.config.json`: `/leitendenbereich/*` and `/api/intern/*` need the role `team_leitende` (`src/lib/server/access.ts`). Other `/api/*` answer only GET; the public functions (Nikolaus booking, contact, polls, meal planning for guests, group orders) stay on the website.
- Uploaded PDF minutes are read in a worker thread that `api/lib/protokoll-text.ts` starts next to the website's API bundle. `vite.worker.config.ts` builds it from the submodule into `vendor/website-astro/api/dist/bundle/` (where `__dirname` of that code points, `vite/legacyCode.ts`), `scripts/check-build.mjs` runs it on a sample PDF at the end of `bun run build`, and the `Dockerfile` copies it into the image.
- Timers (`api/timers/` of website-astro) run as Container Apps Jobs, one per timer, never in the web server: `app.timer()` records them (`functions/timers.ts`), and each job runs `node build/jobs/timer.js <timer>` from the image of `main` on the timer's schedule (cron in UTC, NCRONTAB without the seconds; `test/timer-jobs.test.ts` compares them). A job execution is one container, so each run happens exactly once however many replicas the app has, and previews never run them. The entry is built by `vite.jobs.config.ts` with the same module replacements as the server. Do not add `runOnStartup` or retries: a run that failed half way must not send its mails twice.

### Login

- Leaders sign in with the app registration `website-astro` (Entra, authorization code flow with PKCE). The app proves itself with its Managed Identity `leitenden-website-runtime` (federated credential on the app registration): no secret, no certificate. The API reaches Azure SQL, Blob Storage and Graph as the same app registration, so this app has exactly the rights of the website's API.
- The login is an encrypted cookie (`SESSION_SECRET`, a Container App secret) with who signed in. The teams are read from Graph on every request with a cache of five minutes (`principal.ts`), so a team change applies without a new login.
- Every host needs its login callback `https://<host>/.auth/login/aad/callback` in the app registration. Previews add and remove theirs in the workflow (`.github/scripts/entra-preview-redirect.sh`).
- The test account for previews (`CONFIG.staff.previewOnlyLogins`, `docs/preview-testkonto.md` of website-astro) signs in only on PR previews and gets the roles of every team there; production refuses its login and ignores a session of it (`src/lib/server/previewLogin.ts`). To check a preview logged in: `bun scripts/preview-login.ts https://leitenden-website---pr-<n>.<environment domain> [--shot /leitendenbereich/aufgaben] [--width 1280]` with `PREVIEW_TEST_LOGIN`, `PREVIEW_TEST_PASSWORD` and `PREVIEW_TEST_TOTP_SECRET` set. The session goes to `test-results/preview-auth/` (git-ignored, usable as Playwright `storageState`), screenshots to `test-results/preview-shots/` (390px wide by default). Never print or commit the credentials.
- Locally there is no Managed Identity: use `bun run dev:mock`. `bun run dev` signs in to Azure with the Azure CLI and needs `SESSION_SECRET` (any 32+ characters); its login does not work on localhost.

## Configuration

Non-secret values (IDs, hosts, lifetimes) live in `APP_CONFIG` in `src/lib/server/config.ts`; the configuration shared with the website stays in `CONFIG` of `vendor/website-astro/api/lib/config.ts`. Only secrets and switches are read from the environment, in `src/lib/server/env.ts`. Never add an environment override for a configuration value.

The website's API code reads its own secrets and switches (`vendor/website-astro/api/lib/environment.ts`). In the Container App they are environment variables with `secretref:` to app-level secrets; each secret is a Key Vault reference to the RBAC vault `stamm-phoenix-secrets` (resource group `website-astro`), read by the runtime identity (role „Key Vault Secrets User“). Change a value only in the vault; a new revision or `az containerapp revision restart` picks it up.

- From the vault (secret name = variable in kebab case, e.g. `playwright-api-key`): `PLAYWRIGHT_API_KEY`, `CAMPFLOW_API_TOKEN`, `AZURE_OPENAI_API_KEY`, `GITHUB_REBUILD_TOKEN`, `NAMI_USERNAME`, `NAMI_PASSWORD`, `NIKOLAUS_STATE_SECRET`, `SAMMELBESTELLUNG_LINK_SECRET`. The values were copied from the Static Web App's settings; the website does not reference the vault yet, so a changed value must be set in both places until it does.
- Plain value: `SAMMELBESTELLUNG_CAMPFLOW_CREATE_ENABLED` (as in the Static Web App). `SESSION_SECRET` is a plain Container App secret of this app only.
- Not set: `AZURE_CLIENT_CERT` (Managed Identity instead), `KONTAKT_ALTCHA_SECRET` and `INSTAGRAM_ACCESS_TOKEN` (public website only), `GITHUB_ISSUES_TOKEN` and `AZURE_MAPS_API_KEY` (not set on the website either), the timer switches (see below).
- Timer jobs: they get the same Key Vault references and variables as the app (without `SESSION_SECRET`, `PROTOCOL_HEADER`, the preview names and switches), copied by `.github/scripts/timer-jobs.sh setup <image>`; run it again after adding a secret to the app. Each job has only its own switch as a plain variable, `TASK_REMINDERS_ENABLED`, `LEITENDENRUNDE_REMINDERS_ENABLED` or `ESSENSPLANUNG_AUFBEWAHRUNG_ENABLED`; only `"true"` runs the timer. Switch with `az containerapp job update -g website-astro -n <job> --set-env-vars <SWITCH>=true`; it applies from the next execution. The switches of the Function App `website-astro-task-reminders` must be `"false"` while a job's is on, or mails go out twice.
- Secrets belong to the app and the variables are copied into every new revision, so PR previews get the same values as `main`, including the real CampFlow and NaMi accounts, like the website's previews. `az containerapp update` in the deploy script keeps them; set new ones once with `az containerapp secret set` and `--set-env-vars NAME=secretref:<secret>`.
- `GITHUB_REBUILD_TOKEN` starts the content refresh of the website after a change in the Pflege modules. Only production uses it: a revision with `PREVIEW_DATABASE` never asks for a refresh (`src/lib/server/siteRebuild.ts`), as `GITHUB_ISSUES_TOKEN` is never used by previews in website-astro.

## Hosting and previews

- Azure Container Apps `leitenden-website` in the environment `website-astro-env` (Germany West Central, next to the database), image in `websiteastroacr`. Multiple revision mode: `main` gets all traffic, each PR a revision behind the label `pr-<number>` without traffic (`.github/scripts/container-app.sh`). The `main` revision always keeps one replica running (a start from zero takes about 20 s); previews scale to zero.
- Each PR preview has its own database and blob container `leitende-pr-<number>` on the preview server and in the preview storage account, created, migrated and seeded with invented data by `scripts/preview-db.ts`, dropped when the PR closes. A production revision must never get `PREVIEW_DATABASE` or `PREVIEW_CONTAINER`; the deploy script checks it.
- Database migrations belong to website-astro and run in its deploy job. This app never changes the production schema.
- Timer jobs `leitenden-timer-aufgaben` (`taskReminders`, minute 17 of every hour), `leitenden-timer-leitendenrunde` (`leitendenrundeReminders`, minute 47) and `leitenden-timer-essensplanung` (`essensplanungAufbewahrung`, 03:23 UTC) in the same environment, with the runtime identity, no retries and a timeout of 30 minutes. The `main` deployment gives them the new image after the traffic switch (`timer-jobs.sh image`); previews never touch them. Logs: table `ContainerAppConsoleLogs_CL` with `ContainerJobName_s`; a manual run is `az containerapp job start -g website-astro -n <job>`. To check only the sign-in and the database (`SELECT 1`, sends nothing), override the container: `az containerapp job start -g website-astro -n <job> --container-name <job> --image <image of the job> --cpu 0.5 --memory 1Gi --command node --args build/jobs/timer.js check-identity` (the override has no variables, so no switch is on). Never start a job by hand while its switch is on: it sends real mails.
- The deploy identity is `leitenden-website-deploy` (GitHub OIDC for `main` and pull requests), Contributor on the Container App and the timer jobs. Repository variables hold the IDs; there are no repository secrets.

## Code Style

The rules of website-astro apply (`vendor/website-astro/AGENTS.md`): Svelte 5 runes, `interface` over `type` for object shapes, explicit return types for exported functions, no `any` (use `unknown` with type guards), custom errors extend `Error`, Prettier with 100 columns and single quotes.

### File size

Keep files small. Split a file by domain before it passes about 400 lines, and never extend a file that is far above that: put new code into a new module named after its domain. Test files are split by topic. Brief delegated workers on this rule.

### Naming

| Type             | Convention        | Example                          |
| ---------------- | ----------------- | -------------------------------- |
| Components       | PascalCase        | `StaffHeader.svelte`             |
| Routes           | kebab-case        | `routes/leitendenbereich/aufgaben` |
| Utilities        | camelCase         | `staffPages.ts`, `astroEvents.ts` |
| Server modules   | lowercase         | `lib/server/login.ts`            |
| Tests            | kebab-case        | `test/functions-router.test.ts`  |
| Constants        | UPPER_SNAKE       | `MOVED_PAGES`, `STAFF_ROLE`      |

## Usability for Leitende

The section „Usability for Leitende“ of `vendor/website-astro/AGENTS.md` applies in full; it is the most important rule of this app. In short:

- Leaders are volunteers aged about 18 to 60+, many on a phone, some open a module once a year, nobody gets training. Every screen must work for a first-time, non-technical user.
- Plain German in the „du“ form, sentence case, no IT terms (Login, API, Cache, KI …). Buttons say what they do, and the success message repeats it.
- No explaining prose: no standing sentence that explains a control, a decision from development or what the screen already shows. Labels, placeholders, `StatusLabel` and the „(i)“ (`InfoHint`) carry it.
- Every action shows its result; errors say what failed, whether anything was saved and what to do next, with admin@stamm-phoenix.de for technical problems.
- No lost work: unsaved input is guarded, inputs survive a failed save and an expired login.
- Phones first: check every change at 390px; touch targets at least 44px.
- Use the shared UI components of website-astro (`components/ui/`, `docs/ui/leitfaden.md` there).

## Accessibility

As in website-astro: sections linked to headings (`aria-labelledby`), decorative images with `alt=""` and `aria-hidden`, loading states with `role="status"`, `aria-expanded`/`aria-pressed` where applicable, `width` and `height` on images, the skip link to `#staff-content`.

## Privacy

No analytics, tracking, ad or social widgets and no third-party scripts. Fonts and images come from this origin. Browser storage only for functions the person uses. Pages are `noindex` and send no referrer.

## Changelog

The changelog „Neuigkeiten“ lives in website-astro (`web/src/lib/changelogEntries.ts`); its unread bubble shows here too. A change leaders notice in this app gets an entry there, in a PR of website-astro, following its rules (IDs, date in Berlin, plain wording). Say in the PR description of this repo which entry covers it, or why none is needed.

## Focused Verification

- Choose the smallest set of checks that covers the change: `bun run check`, `bun test`, `bun run build`.
- For UI changes, check the affected pages in `bun run dev:mock` on one viewport (390px for phone-relevant changes) and walk the flow as a first-time user.
- For changes to login, access or the adapter, add a unit test and check the PR preview with a real login.
- Do not repeat passing checks without a relevant change.

## Before Committing

1. `bun run check`, `bun test` and `bun run build` pass.
2. UI changes are checked in the browser (see above) and against „Usability for Leitende“: every visible sentence your diff adds is a label, a placeholder, a result, an error or a note for the state on screen.
3. A changed submodule pointer comes with aligned dependency versions.
4. Changes leaders notice have their changelog entry in website-astro.

## Git History

Keep the history linear: rebase onto `origin/main` and push with `git push --force-with-lease` instead of merging `main` into a branch. Merge PRs with „Rebase and merge“ where possible.
