# BookProgress

Track your book's progress through git history. Dashboard with word counts, text metrics, character mentions, and configurable goals. All from your existing git repo — no extra tooling.

![](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![](https://img.shields.io/badge/pnpm-11-blue)

## Quick start

```bash
pnpm install
pnpm extract
open data/index.html
```

Edit `bookprogress.config.json` to point `bookFolder` at your git-tracked writing folder. Run `pnpm extract` whenever you want updated stats. Open `data/index.html` in any browser — self-contained, no server needed.

## How it works

1. Reads git history (`git log --numstat`) for all commits
2. Runs `git diff --word-diff=porcelain` on each changed `.md` file
3. Counts words added, removed, modified per day
4. Analyzes manuscript text: sentence length, LIX readability, dialogue ratio, passive voice, adverbs, vocabulary richness, sentiment
5. Extracts character names from capitalized word sequences (filtered for noise)
6. Generates a self-contained HTML dashboard with Chart.js

## Configuration

All settings in `bookprogress.config.json`:

```json
{
  "bookFolder": "./my-novel",
  "dailyWordGoal": 500,
  "totalWordGoal": 80000,
  "chapterTargetWords": 2500,
  "textAnalysisSection": "Manuscript",
  "thresholds": {
    "adverbRatio": { "good": 5, "warn": 10 },
    "passiveRatio": { "good": 2, "warn": 5 },
    "ttr": { "good": 50, "warn": 35 },
    "lix": { "goodMin": 30, "goodMax": 50, "warnMin": 25, "warnMax": 60 },
    "sentenceLengthAvg": { "goodMin": 10, "goodMax": 20, "warnMin": 5, "warnMax": 30 },
    "dialogueRatio": { "goodMin": 30, "goodMax": 70, "warnMin": 15, "warnMax": 85 },
    "topWordFreq": { "good": 50, "warn": 65 }
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `bookFolder` | `./Ruindykarna` | Path to git repo with your book |
| `dailyWordGoal` | `500` | Target words per writing session |
| `totalWordGoal` | `80000` | Target total word count |
| `chapterTargetWords` | `2500` | Expected words per chapter |
| `textAnalysisSection` | `Manuscript` | Which folder to analyze for text metrics (and sole tracked path) |
| `language` | `null` | `"swedish"`, `"english"`, or `null` for auto-detect |
| `thresholds` | (see above) | Color thresholds for metric cards |

> **Note:** Only files under `textAnalysisSection` are tracked and analyzed. `trackPatterns` and `excludePatterns` are removed — all filtering is now path-prefix based.

## CLI

```bash
pnpm extract                 # Full extract
pnpm extract --help          # Show all options
pnpm extract -c my-conf.json # Custom config
pnpm extract --json-only     # Skip HTML generation
pnpm extract --html-only     # Only rebuild HTML from existing JSON
pnpm test                    # Run tests
pnpm lint                    # Lint with Biome
```

## Dashboard

Open `data/index.html` in any browser.

### Charts
- **Daily Words** — bars: added (green) / removed (red) per day
- **Cumulative Progress** — line: total words vs goal line vs daily pace
- **Writing Style** — dual-axis: sentence length, LIX, dialogue %, passive, adverbs
- **Writing Schedule** — when commits happen (24h heatmap)
- **Vocabulary Richness** — TTR, Honoré's R, top-100 word density
- **Sentiment Trend** — polarity over time (−100 to +100)
- **Character Mentions** — top entities by frequency (horizontal bar)

### Metric cards
Hover any metric for explanation, formula, and famous book benchmarks:
- **Avg Sentence Length** — Hemingway 10, Rowling 12, Fiction avg 15–20
- **LIX Readability** — Harry Potter 25, Da Vinci Code 30, Academic 55+
- **Dialogue Ratio** — Hemingway 60%, Tolkien 30%
- **Adverb Density** — King recommends <5/1000w
- **TTR (vocabulary)** — Shakespeare 85, Hemingway 55, Avg fiction 45–50
- **Passive Voice** — Good fiction <2/1000w
- **Sentiment** — Tragedies −50, Comedies +30

### Drill-down
- Click section tabs to filter charts by folder
- Click any file/chapter row to see per-file stats and word history

### Settings
Settings button shows all current config values and thresholds. Edit `bookprogress.config.json` to change them.

### Mobile
Responsive layout — single-column charts, scrolling tables, viewport-aware tooltips.

## Project structure

```
bookprogress/
├── bookprogress.config.json   # Your settings
├── index.html                 # Dashboard template
├── package.json
├── biome.json                 # Linter config
├── src/
│   ├── extract.mjs            # CLI entry point
│   ├── extract.test.mjs       # Tests
│   └── lib/
│       ├── config.mjs         # Config loader with defaults
│       ├── git.mjs            # Git operations via simple-git
│       ├── aggregate.mjs      # Data aggregation + text analysis routing
│       └── textstats.mjs      # Swedish text analysis engine
└── data/                      # Generated (gitignored)
    ├── progress.json          # Raw extracted data
    └── index.html             # Self-contained dashboard
```

## Requirements

- Node.js ≥ 20
- pnpm (or npm/yarn)
- A git-tracked folder with markdown files

## Text analysis details

All metrics adapted for Swedish:
- **LIX**: `(words/sentences) + (longWords × 100 / words)` — standard Swedish readability
- **Passive**: S-passives (`skrivs`, `görs`) + periphrastic (`blir skriven`)
- **Adverbs**: Dictionary of ~110 common Swedish adverbs + `-vis`/`-ligen`/`-t` suffixes
- **Sentiment**: ~80 positive and ~80 negative Swedish word stems
- **Entities**: Capitalized word sequences (1-3 words), filtered with Swedish stop-words, minimum 3 occurrences

## License

MIT

## Docker / Kubernetes

### Docker

```bash
docker build -t bookprogress .
docker run -p 8080:80 \
  -e EXTRACT_INTERVAL=3600 \
  -v ./Ruindykarna:/book \
  bookprogress
# open http://localhost:8080
```

The container runs nginx + a scheduled extract loop. Set `EXTRACT_INTERVAL` (seconds, default 3600) to control refresh rate.

### Kubernetes

Three manifests in `k8s/`:

| File | Purpose |
|------|---------|
| `deployment.yaml` | ConfigMap + PVC + Deployment + Service + Ingress |
| `cronjob.yaml` | CronJob that runs extract on a schedule |

```bash
# Edit deployment.yaml: set BOOK_REPO and ingress host
# Edit cronjob.yaml: set schedule
kubectl apply -f k8s/
```

Init container clones your book repo into a PVC. Dashboard container mounts it and re-extracts on `EXTRACT_INTERVAL`.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXTRACT_INTERVAL` | `3600` | Seconds between extract runs |
| `CONFIG_PATH` | `/app/bookprogress.config.json` | Path to config file |

### GitHub Actions

Push to `main` → builds multi-arch image (`linux/amd64`, `linux/arm64`) and pushes to `ghcr.io/<user>/<repo>:latest`. Uses QEMU + buildx.
