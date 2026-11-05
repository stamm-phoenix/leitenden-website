# Leitendenbereich Stamm Phoenix

Der Leitendenbereich von DPSG Stamm Phoenix als eigene App: SvelteKit auf Azure Container Apps,
mit dem Code der Website ([website-astro](https://github.com/stamm-phoenix/website-astro)) als
Submodule. Hintergrund: [Diskussion #524](https://github.com/stamm-phoenix/website-astro/discussions/524),
[Issue #526](https://github.com/stamm-phoenix/website-astro/issues/526).

```bash
git clone --recurse-submodules https://github.com/stamm-phoenix/leitenden-website.git
bun install
bun run dev:mock    # http://localhost:5173 mit Testdaten
```

Regeln und Aufbau: [AGENTS.md](AGENTS.md).
