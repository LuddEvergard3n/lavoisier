# Lavoisier

![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=111111)
![Canvas](https://img.shields.io/badge/Canvas-2D-0F766E)
![Modules](https://img.shields.io/badge/Modules-26-7C3AED)
![Checks](https://img.shields.io/badge/Checks-passing-2563EB)

Interactive chemistry laboratory covering high-school, undergraduate, and selected graduate-level topics through visual models, calculations, and guided exercises.

## Scope

Version 2.0 includes 26 modules, 460 catalogued exercises, and seven laboratory tools. High-school concepts form the main learning path; undergraduate and graduate topics remain available as progressive depth.

## Highlights

- Interactive Canvas simulations and property visualizations.
- Chemical equation, stoichiometry, titration, orbital, Lewis structure, and solubility tools.
- Hash-routed single-page interface with lazy module loading.
- Progress and preferences stored locally.
- Editorial metadata, model limitations, and traceable scientific sources for every module.
- Resume-study history and persistent module filters.
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
npm start
```

Open `http://localhost:8080`. Native modules require HTTP and do not work correctly through `file://`.

## Tests

```bash
npm test
```

The runner reports deterministic checks, not an inflated count of independent behavioral tests. It validates data, prerequisites, citations, module syntax, offline assets, routes, and tool inventory.

## Structure

```text
css/          Design tokens, layout, themes, and mobile rules
js/           Bootstrap, routing, state, UI, and simulation engines
modules/      26 chemistry modules loaded on demand
data/         Element, module, source, citation, and review metadata
tests/        Dependency-free Node.js test runner
```

Each module exports `render(outlet)` and `destroy()`. Simulation loops, animation frames, and event listeners must be released during `destroy()` so navigation cannot leave background work running.

## Editorial sources

Core references include the IUPAC Gold Book and nomenclature recommendations, NIST Chemistry WebBook and CODATA constants, PubChem element data, IAEA nuclear-science materials, EPA environmental summaries, and the peer-reviewed OpenStax Chemistry 2e textbook. The application keeps metadata locally and never requires a remote source during normal use.

These sources were used as references, not as runtime dependencies. Institutional data is displayed with scope and limitations rather than treated as infallible.

## Browser support

- Chrome and Edge 90 or later.
- Firefox 90 or later.
- Safari 15 or later.
- Current iOS and Android browsers, including touch interactions.

## Live version

[luddevergard3n.github.io/lavoisier](https://luddevergard3n.github.io/lavoisier/)

## License

See the repository license file.
