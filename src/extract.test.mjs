import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadConfig } from './lib/config.mjs'

describe('config', () => {
  it('loads and applies defaults', async () => {
    const config = await loadConfig('bookprogress.config.json')
    assert.ok(config.bookFolder.endsWith('Ruindykarna'))
    assert.strictEqual(config.dailyWordGoal, 500)
    assert.strictEqual(config.totalWordGoal, 80_000)
    assert.strictEqual(config.textAnalysisSection, '04 - Manuscript')
    assert.strictEqual(config.language, null)
  })

  it('throws on missing bookFolder', async () => {
    await assert.rejects(() => loadConfig('nonexistent.json'))
  })
})

describe('git', () => {
  it('getCommitHistory returns commits in order', async () => {
    // Dynamic import so test can load as needed
    const { getCommitHistory } = await import('./lib/git.mjs')
    const { loadConfig: lc } = await import('./lib/config.mjs')
    const config = await lc()

    const commits = await getCommitHistory(config.bookFolder)

    assert.ok(commits.length > 0, 'should have at least one commit')
    assert.ok(commits[0].hash)
    assert.ok(commits[0].date)
    assert.ok(Array.isArray(commits[0].files))

    // Verify ascending date order (reverse chronological from git is reversed to chronological)
    for (let i = 1; i < commits.length; i++) {
      assert.ok(commits[i].date >= commits[i - 1].date, 'commits should be in date order')
    }
  })

  it('getTrackedMdFiles returns .md files', async () => {
    const { getTrackedMdFiles } = await import('./lib/git.mjs')
    const { loadConfig: lc } = await import('./lib/config.mjs')
    const config = await lc()

    const files = await getTrackedMdFiles(config.bookFolder)
    assert.ok(files.length > 0)
    assert.ok(files.every((f) => f.endsWith('.md')))
  })

  it('getWordDiff for existing file returns counts', async () => {
    const { getWordDiff, getTrackedMdFiles } = await import('./lib/git.mjs')
    const { getCommitHistory } = await import('./lib/git.mjs')
    const { loadConfig: lc } = await import('./lib/config.mjs')
    const config = await lc()

    const commits = await getCommitHistory(config.bookFolder)
    const firstCommit = commits[0]
    const files = await getTrackedMdFiles(config.bookFolder)

    if (files.length > 0) {
      const diff = await getWordDiff(config.bookFolder, firstCommit.hash, files[0])
      assert.ok(typeof diff.added === 'number')
      assert.ok(typeof diff.removed === 'number')
      assert.ok(diff.added >= 0)
      assert.ok(diff.removed >= 0)
    }
  })
})

describe('aggregate', () => {
  it('buildReport returns valid structure', async () => {
    const { loadConfig: lc } = await import('./lib/config.mjs')
    const { buildReport } = await import('./lib/aggregate.mjs')
    const config = await lc()

    const report = await buildReport(config.bookFolder, config)

    assert.ok(Array.isArray(report.days))
    assert.ok(typeof report.totalWords === 'number')
    assert.ok(typeof report.dailyGoal === 'number')
    assert.ok(typeof report.totalGoal === 'number')

    if (report.days.length > 0) {
      const day = report.days[0]
      assert.ok(day.date)
      assert.ok(typeof day.wordsAdded === 'number')
      assert.ok(typeof day.wordsRemoved === 'number')
      assert.ok(typeof day.wordsNet === 'number')
      assert.ok(typeof day.totalWords === 'number')
      assert.ok(Array.isArray(day.files))

      // totalWords should accumulate correctly
      const lastDay = report.days[report.days.length - 1]
      assert.strictEqual(lastDay.totalWords, report.totalWords)
    }

    if (report.estimatedFinish) {
      assert.ok(typeof report.estimatedFinish === 'object')
      assert.ok('paced' in report.estimatedFinish)
      assert.ok('onTrack' in report.estimatedFinish)
    }
  })
})
