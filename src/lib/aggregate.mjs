/**
 * @typedef {Object} DayStats
 * @property {string} date - YYYY-MM-DD
 * @property {number} wordsAdded
 * @property {number} wordsRemoved
 * @property {number} wordsChanged
 * @property {number} wordsNet
 * @property {number} totalWords
 * @property {FileWordDiff[]} files
 * @property {TextStats} [textStats]
 */

/**
 * @typedef {Object} FileWordDiff
 * @property {string} path
 * @property {number} wordsAdded
 * @property {number} wordsRemoved
 * @property {boolean} [deleted]
 * @property {TextStats} [textStats]
 */

/**
 * @typedef {Object} TextStats
 * @property {number} sentenceLengthAvg
 * @property {number} dialogueRatio
 * @property {number} lix
 * @property {number} paragraphCount
 */

/**
 * @typedef {Object} ProgressReport
 * @property {DayStats[]} days
 * @property {number} totalWords
 * @property {number} dailyGoal
 * @property {number} totalGoal
 * @property {string} [estimatedFinish]
 * @property {Object<string,number>} commitHours
 * @property {Object<string,{total:number, days: Object<string,number>}>} characterTrends
 * @property {Object<string, number>} chapterWordCounts
 * @property {number} editRatio
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { getCommitHistory, getFileContent, getWordDiff } from './git.mjs'
import { analyzeText, detectLanguage } from './textstats.mjs'

/**
 * Aggregate git history into daily progress report
 * @param {string} cwd - path to git repo
 * @param {import('./config.mjs').Config} config
 * @returns {Promise<ProgressReport>}
 */
export async function buildReport(cwd, config) {
  const commits = await getCommitHistory(cwd)

  /** @type {Map<string, DayStats>} */
  const dayMap = new Map()

  /** @type {Object<string, number>} */
  const commitHours = {}

  /** @type {Map<string, ReturnType<typeof analyzeText>>} */
  const fileAnalysisCache = new Map()

  let lang = config.language || null

  for (const commit of commits) {
    const dateKey = commit.date.slice(0, 10)
    const hour = Number(commit.date.slice(11, 13))
    commitHours[hour] = (commitHours[hour] || 0) + 1

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        wordsAdded: 0,
        wordsRemoved: 0,
        wordsChanged: 0,
        wordsNet: 0,
        totalWords: 0,
        files: [],
      })
    }

    const day = dayMap.get(dateKey)

    for (const file of commit.files) {
      const resolvedPath = resolveRenamePath(file.path)
      if (!isInAnalysisSection(resolvedPath, config)) continue

      const wordDiff = await getWordDiff(cwd, commit.hash, commit.parent, resolvedPath)
      // Check if file was deleted (numstat shows 0 adds, >0 deletes = removed from repo)
      const isDeleted = file.added === 0 && file.deleted > 0

      // Text analysis for all markdown files
      const cacheKey = `${commit.hash}:${resolvedPath}`
      if (!fileAnalysisCache.has(cacheKey)) {
        const content = await getFileContent(cwd, commit.hash, resolvedPath)
        if (content) {
          if (!lang) lang = detectLanguage(content)
          fileAnalysisCache.set(cacheKey, analyzeText(content, lang))
        }
      }
      const fileTextStats = fileAnalysisCache.get(cacheKey)

      day.files.push({
        path: resolvedPath,
        wordsAdded: wordDiff.added,
        wordsRemoved: wordDiff.removed,
        deleted: isDeleted,
        textStats: fileTextStats,
      })

      // Deleted files still show in history but don't count toward net progress
      if (!isDeleted) {
        day.wordsAdded += wordDiff.added
        day.wordsRemoved += wordDiff.removed
        day.wordsChanged += Math.min(wordDiff.added, wordDiff.removed)
      }
    }

    day.wordsNet = day.wordsAdded - day.wordsRemoved
  }

  const days = [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date))

  // Compute running totals
  let running = 0
  for (const day of days) {
    running += day.wordsNet
    day.totalWords = running
  }

  // Aggregate text stats per day from snapshot of ALL files at that point
  /** @type {Map<string, ReturnType<typeof analyzeText>>} */
  const fileSnapshot = new Map()
  for (const day of days) {
    // Update snapshot with files modified today
    for (const f of day.files) {
      if (f.textStats && !f.deleted) {
        fileSnapshot.set(f.path, f.textStats)
      } else if (f.deleted) {
        fileSnapshot.delete(f.path)
      }
    }

    // Weighted average across entire manuscript at this point
    const analysesForDay = []
    for (const ts of fileSnapshot.values()) {
      analysesForDay.push({ wordCount: ts.wordCount, textStats: ts })
    }

    if (analysesForDay.length > 0) {
      // Weighted average by word count
      const totalWords = analysesForDay.reduce((s, a) => s + a.wordCount, 0)
      const wavg = (field) =>
        Math.round(
          (analysesForDay.reduce((s, a) => s + a.textStats[field] * a.wordCount, 0) / totalWords) *
            10,
        ) / 10
      day.textStats = {
        sentenceLengthAvg: wavg('sentenceLengthAvg'),
        sentenceLengthStdDev: wavg('sentenceLengthStdDev'),
        dialogueRatio: wavg('dialogueRatio'),
        lix: wavg('lix'),
        flesch: wavg('flesch'),
        paragraphCount: analysesForDay.reduce((s, a) => s + a.textStats.paragraphCount, 0),
        passiveRatio: wavg('passiveRatio'),
        adverbRatio: wavg('adverbRatio'),
        ttr: wavg('ttr'),
        hapaxCount: analysesForDay.reduce((s, a) => s + a.textStats.hapaxCount, 0),
        honoreR: wavg('honoreR'),
        topWordFreq: wavg('topWordFreq'),
        sentimentPolarity: wavg('sentimentPolarity'),
        sentimentDensity: wavg('sentimentDensity'),
      }
    }
  }

  const totalWords = days.length > 0 ? days[days.length - 1].totalWords : 0
  const estimatedFinish = computeEstimate(
    days,
    totalWords,
    config.totalWordGoal,
    config.dailyWordGoal,
  )

  // Chapter word counts and stats (from most recent file stats across all days)
  const chapterWordCounts = {}
  const chapterStats = {}
  const seenPaths = new Set()
  for (let i = days.length - 1; i >= 0; i--) {
    for (const f of days[i].files) {
      if (seenPaths.has(f.path) || f.deleted) continue
      seenPaths.add(f.path)
      if (f.textStats) {
        chapterWordCounts[f.path] = f.textStats.wordCount
        chapterStats[f.path] = f.textStats
      }
    }
  }

  // Filter chapterWordCounts to only files that exist at HEAD
  for (const path of Object.keys(chapterWordCounts)) {
    if (!existsSync(join(cwd, path))) {
      delete chapterWordCounts[path]
    }
  }

  // Overall edit ratio
  let totalAdded = 0
  let totalChanged = 0
  for (const day of days) {
    for (const file of day.files) {
      if (file.deleted) continue
      totalAdded += file.wordsAdded
      totalChanged += Math.min(file.wordsAdded, file.wordsRemoved)
    }
  }
  const editRatio = totalAdded > 0 ? Math.round((totalChanged / totalAdded) * 100) : 0

  // Entity trends: aggregate entities from all manuscript files (latest version of each)
  const entityTotals = new Map()
  const entityDays = new Map()
  for (const day of days) {
    for (const f of day.files) {
      if (!f.textStats?.entities) continue
      for (const [name, count] of Object.entries(f.textStats.entities)) {
        entityTotals.set(name, (entityTotals.get(name) || 0) + count)
        if (!entityDays.has(name)) entityDays.set(name, {})
        entityDays.get(name)[day.date] = (entityDays.get(name)[day.date] || 0) + count
      }
    }
  }
  // Filter: must appear at least 3 times to be considered a character
  const characterTrends = {}
  for (const [name, total] of entityTotals) {
    if (total < 3) continue
    characterTrends[name] = { total, days: entityDays.get(name) || {} }
  }

  return {
    days,
    bookFolder: config.bookFolder,
    totalWords,
    dailyGoal: config.dailyWordGoal,
    totalGoal: config.totalWordGoal,
    chapterTargetWords: config.chapterTargetWords,
    wordsPerPage: config.wordsPerPage,
    authorName: config.authorName,
    textAnalysisSection: config.textAnalysisSection,
    estimatedFinish,
    commitHours,
    characterTrends,
    chapterWordCounts,
    chapterStats,
    editRatio,
    thresholds: config.thresholds,
  }
}

/**
 * Check if file path falls within the textAnalysisSection.
 * Matches exact path or any path under the section folder.
 */
function isInAnalysisSection(path, config) {
  if (!config.textAnalysisSection) return false
  const ext = config.fileExtension || '.md'
  if (!path.endsWith(ext)) return false
  const section = config.textAnalysisSection.replace(/\/+$/, '')
  return path === section || path.startsWith(`${section}/`)
}

/**
 * Handle rename paths: "old => new" → returns new path
 */
function resolveRenamePath(path) {
  const match = path.match(/=>\s*(.+)/)
  return match ? match[1].replace(/^"|"$/g, '') : path
}

/**
 * Estimate finish date based on average daily words and remaining
 */
function computeEstimate(days, totalWords, totalGoal, dailyGoal) {
  if (days.length === 0 || totalWords >= totalGoal) return { paced: null, onTrack: null }

  const remaining = totalGoal - totalWords

  // Paced: total words / calendar days since first commit
  const firstDate = new Date(days[0].date)
  const lastDate = new Date(days[days.length - 1].date)
  const calendarDays = Math.round((lastDate - firstDate) / 86400000) + 1
  const allTimeAvg = totalWords / calendarDays
  const pacedDays = allTimeAvg > 0 ? Math.ceil(remaining / allTimeAvg) : null

  // On-track: if daily goal is hit every day from now
  const onTrackDays = dailyGoal > 0 ? Math.ceil(remaining / dailyGoal) : null

  const now = new Date()
  const addDays = (d) => {
    if (d === null) return null
    const dt = new Date(now)
    dt.setDate(dt.getDate() + d)
    return dt.toISOString().slice(0, 10)
  }

  return {
    paced: addDays(pacedDays),
    onTrack: addDays(onTrackDays),
  }
}
