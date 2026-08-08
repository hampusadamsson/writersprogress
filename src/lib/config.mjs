import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DEFAULTS = {
  dailyWordGoal: 500,
  totalWordGoal: 80_000,
  chapterTargetWords: 2_500,
  textAnalysisSection: 'Manuscript',
  fileExtension: '.md',
  language: null, // 'swedish' | 'english' | null (auto-detect)
  wordsPerPage: 300,
  authorName: 'Hampus Adamsson',
}

/**
 * @typedef {Object} Config
 * @property {string} bookFolder
 * @property {number} dailyWordGoal
 * @property {number} totalWordGoal
 * @property {number} chapterTargetWords
 * @property {string} textAnalysisSection
 * @property {Object} [thresholds]
 * @property {'swedish'|'english'|null} [language]
 */

/**
 * Load and validate config from bookprogress.config.json
 * @param {string} [configPath]
 * @returns {Promise<Config>}
 */
export async function loadConfig(configPath = 'bookprogress.config.json') {
  const raw = await readFile(configPath, 'utf-8')
  const parsed = JSON.parse(raw)

  const config = { ...DEFAULTS, ...parsed }

  if (!config.bookFolder) {
    throw new Error('bookprogress.config.json: "bookFolder" is required')
  }

  config.bookFolder = resolve(config.bookFolder)

  // Default thresholds
  config.thresholds = {
    adverbRatio: { good: 5, warn: 10 },
    passiveRatio: { good: 2, warn: 5 },
    ttr: { good: 50, warn: 35 },
    lix: { goodMin: 30, goodMax: 50, warnMin: 25, warnMax: 60 },
    sentenceLengthAvg: { goodMin: 10, goodMax: 20, warnMin: 5, warnMax: 30 },
    dialogueRatio: { goodMin: 30, goodMax: 70, warnMin: 15, warnMax: 85 },
    topWordFreq: { good: 50, warn: 65 },
    ...(config.thresholds || {}),
  }

  return config
}
