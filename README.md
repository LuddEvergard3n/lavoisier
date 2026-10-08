# Lavoisier

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=111111)
![Canvas](https://img.shields.io/badge/Canvas-2D-0F766E)
![Modules](https://img.shields.io/badge/Modules-26-7C3AED)
![Tests](https://img.shields.io/badge/Tests-603-2563EB)

Interactive chemistry laboratory covering high-school, undergraduate, and selected graduate-level topics through visual models, calculations, and guided exercises.

## Scope

Version 1.9.4 includes 26 modules, 460 exercises, and seven laboratory tools. The curriculum ranges from atomic structure, stoichiometry, and organic chemistry to spectroscopy, quantum mechanics, solid-state chemistry, molecular symmetry, photochemistry, and catalysis.

## Highlights

- Interactive Canvas simulations and property visualizations.
- Chemical equation, stoichiometry, titration, orbital, Lewis structure, and solubility tools.
- Hash-routed single-page interface with lazy module loading.
- Progress and preferences stored locally.
- Teacher guide and lesson-plan generator.
- Mouse and touch interaction through a shared drag manager.
- No runtime framework or build pipeline.

## Stack

| Layer | Technology |
|---|---|
| Interface | HTML5 and CSS3 |
| Application | Native JavaScript modules |
| Simulation | Canvas 2D |
| Content | JSON metadata and module files |
| Persistence | `localStorage` |
| Tests | Node.js standard library |

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Native modules require HTTP and do not work correctly through `file://`.

## Tests

```bash
node tests/test-runner.js
```

Expected result: 603 passing checks and no failures.

## Structure

```text
css/          Design tokens, layout, themes, and mobile rules
js/           Bootstrap, routing, state, UI, and simulation engines
modules/      26 chemistry modules loaded on demand
data/         Element and module metadata
tests/        Dependency-free Node.js test runner
```

Each module exports `render(outlet)` and `destroy()`. Simulation loops, animation frames, and event listeners must be released during `destroy()` so navigation cannot leave background work running.

## Browser support

- Chrome and Edge 90 or later.
- Firefox 90 or later.
- Safari 15 or later.
- Current iOS and Android browsers, including touch interactions.

## Live version

[luddevergard3n.github.io/lavoisier](https://luddevergard3n.github.io/lavoisier/)

## License

See the repository license file.
