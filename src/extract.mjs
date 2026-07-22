import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { buildReport } from './lib/aggregate.mjs'
import { loadConfig } from './lib/config.mjs'

const OUTPUT_JSON = resolve('data/progress.json')
const OUTPUT_HTML = resolve('data/index.html')
const OUTPUT_HTML2 = resolve('data/progress.html')
const OUTPUT_HTML3 = resolve('data/index2.html')
const TEMPLATE = resolve('index.html')
const TEMPLATE2 = resolve('progress.html')
const TEMPLATE3 = resolve('index2.html')
const FALLBACK_TEMPLATE = resolve('src/template.html')

const HELP = `Writing Tracker — track your writing progress through git history

Usage:
  pnpm extract [options]
  node src/extract.mjs [options]

Options:
  --config, -c <path>   Path to config file (default: bookprogress.config.json)
  --json-only            Only write JSON, skip HTML generation
  --html-only            Only write HTML (requires existing data/progress.json)
  --help, -h             Show this help

Config file (bookprogress.config.json):
  bookFolder            Path to git repo with your book files
  dailyWordGoal         Target words per writing session
  totalWordGoal         Target total words for finished book
  chapterTargetWords    Expected words per chapter (for progress bars)
  textAnalysisSection   Which folder to analyze for text metrics
  trackPatterns         Glob patterns for files to track
  excludePatterns       Glob patterns for files to skip
  thresholds            Color thresholds for metric cards

Examples:
  pnpm extract                          # Full extract with defaults
  pnpm extract --config my-book.json    # Custom config file
  pnpm extract --json-only              # Only write data/progress.json
  pnpm extract --html-only              # Only write data/index.html

Output:
  data/progress.json    Raw extracted data
  data/index.html       Self-contained dashboard (open in browser)
`

function parseArgs(args) {
  const opts = {
    configPath: 'bookprogress.config.json',
    jsonOnly: false,
    htmlOnly: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
      case '-h': {
        console.log(HELP)
        process.exit(0)
        break
      }
      case '--config':
      case '-c':
        opts.configPath = args[++i]
        break
      case '--json-only':
        opts.jsonOnly = true
        break
      case '--html-only':
        opts.htmlOnly = true
        break
      default:
        // Ignore unknown flags
        break
    }
  }

  return opts
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))

  if (opts.htmlOnly) {
    await generateHtml()
    return
  }

  console.log('Writing Tracker — extracting git history...\n')

  const config = await loadConfig(opts.configPath)
  console.log(`  Config:      ${opts.configPath}`)
  console.log(`  Book folder: ${config.bookFolder}`)
  console.log(`  Daily goal:  ${config.dailyWordGoal.toLocaleString()} words`)
  console.log(`  Total goal:  ${config.totalWordGoal.toLocaleString()} words`)
  console.log(`  Metrics for: ${config.textAnalysisSection}`)
  console.log(`  Chapter tgt: ${config.chapterTargetWords.toLocaleString()} words\n`)

  const report = await buildReport(config.bookFolder, config)

  console.log(`  Days with commits: ${report.days.length}`)
  console.log(`  Total words:       ${report.totalWords.toLocaleString()}`)
  if (report.estimatedFinish) {
    console.log(`  Est. finish (pace): ${report.estimatedFinish.paced || '—'}`)
    console.log(`  Est. finish (goal): ${report.estimatedFinish.onTrack || '—'}`)
  }
  console.log(`  Characters found:   ${Object.keys(report.characterTrends || {}).length}`)
  if (report.editRatio !== undefined) {
    console.log(`  Edit ratio:         ${report.editRatio}%`)
  }

  await mkdir(dirname(OUTPUT_JSON), { recursive: true })
  await writeFile(OUTPUT_JSON, JSON.stringify(report, null, 2))
  console.log(`\n  Wrote ${OUTPUT_JSON}`)

  if (!opts.jsonOnly) {
    await generateHtml(report)
  }

  console.log('\nDone.')
  if (!opts.jsonOnly) {
    console.log('   Open data/index.html in your browser.')
  }
}

async function generateHtml(report) {
  // If report not provided, load from existing JSON
  if (!report) {
    try {
      const raw = await readFile(OUTPUT_JSON, 'utf-8')
      report = JSON.parse(raw)
    } catch {
      console.error('No data/progress.json found. Run without --html-only first.')
      process.exit(1)
    }
  }

  let template
  try {
    template = await readFile(TEMPLATE, 'utf-8')
  } catch {
    template = await readFile(FALLBACK_TEMPLATE, 'utf-8')
  }
  const html = template.replace(
    '// __PROGRESS_JSON__',
    `const __PROGRESS_JSON__ = ${JSON.stringify(report)};`,
  )
  await writeFile(OUTPUT_HTML, html)
  console.log(`  Wrote ${OUTPUT_HTML}`)

  // Also generate progress.html if template exists
  let template2
  try {
    template2 = await readFile(TEMPLATE2, 'utf-8')
  } catch {
    // progress.html is optional
  }
  if (template2) {
    const html2 = template2.replace(
      '// __PROGRESS_JSON__',
      `const __PROGRESS_JSON__ = ${JSON.stringify(report)};`,
    )
    await writeFile(OUTPUT_HTML2, html2)
    console.log(`  Wrote ${OUTPUT_HTML2}`)
  }

  // Also generate index2.html if template exists
  let template3
  try {
    template3 = await readFile(TEMPLATE3, 'utf-8')
  } catch {
    // index2.html is optional
  }
  if (template3) {
    const html3 = template3.replace(
      '// __PROGRESS_JSON__',
      `const __PROGRESS_JSON__ = ${JSON.stringify(report)};`,
    )
    await writeFile(OUTPUT_HTML3, html3)
    console.log(`  Wrote ${OUTPUT_HTML3}`)
  }
}

main().catch((err) => {
  console.error('Extraction failed:', err.message)
  console.error('   Run with --help for usage information.')
  process.exit(1)
})
