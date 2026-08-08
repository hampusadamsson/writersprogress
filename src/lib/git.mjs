import { simpleGit } from 'simple-git'

/**
 * @typedef {Object} CommitInfo
 * @property {string} hash
 * @property {string} date - ISO date string
 * @property {string} message
 * @property {string|null} parent - parent commit hash, null for root
 * @property {FileStat[]} files
 */

/**
 * @typedef {Object} FileStat
 * @property {string} path
 * @property {number} added - lines added (numstat)
 * @property {number} deleted - lines deleted (numstat)
 */

/**
 * Get commit log with --numstat for all commits
 * @param {string} cwd - path to git repo
 * @returns {Promise<CommitInfo[]>}
 */
export async function getCommitHistory(cwd) {
  const git = simpleGit(cwd)

  // Parse --numstat output: "added\ttab\tfilepath"
  const log = await git.raw(['log', '--format=%H|%aI|%s', '--numstat', '--find-renames', '--all', '--reverse'])

  return parseNumstatLog(log)
}

/**
 * Get word-level diff for a file at a specific commit.
 * For root commit (no parent): counts all words in file as added.
 * For other commits: uses git diff --word-diff=porcelain parent..commit.
 * @param {string} cwd - path to git repo
 * @param {string} commitHash
 * @param {string|null} parentHash - parent commit hash, or null for root commit
 * @param {string} filePath
 * @returns {Promise<{added: number, removed: number}>}
 */
export async function getWordDiff(cwd, commitHash, parentHash, filePath) {
  const git = simpleGit(cwd)

  // Root commit — count all words as added
  if (!parentHash) {
    try {
      const content = await git.show([`${commitHash}:${filePath}`])
      const wordCount = content.split(/\s+/).filter(Boolean).length
      return { added: wordCount, removed: 0 }
    } catch {
      return { added: 0, removed: 0 }
    }
  }

  // Normal commit — word-diff against parent
  try {
    const diff = await git.raw([
      'diff',
      '--word-diff=porcelain',
      parentHash,
      commitHash,
      '--',
      filePath,
    ])
    return countWordDiff(diff)
  } catch {
    return { added: 0, removed: 0 }
  }
}

/**
 * Get list of all .md files tracked in the repo
 * @param {string} cwd
 * @returns {Promise<string[]>}
 */
export async function getTrackedMdFiles(cwd) {
  const git = simpleGit(cwd)
  try {
    const files = await git.raw(['ls-files', '--', '*.md'])
    return files
      .split('\n')
      .filter(Boolean)
      .map((f) => decodeGitPath(f.replace(/^"|"$/g, '').trim()))
  } catch {
    return []
  }
}

/**
 * Decode octal escape sequences in git output paths as UTF-8.
 * E.g. "R\303\244lar" → "Rälar"
 */
function decodeGitPath(path) {
  // Replace each octal escape with its raw byte, then decode as UTF-8
  const raw = path.replace(/\\([0-7]{3})/g, (_, octal) => {
    return String.fromCharCode(Number.parseInt(octal, 8))
  })
  // The latin-1 → utf-8 fix: raw now has each byte as a char.
  // Encode those bytes back to a buffer, then decode as UTF-8.
  const bytes = new Uint8Array([...raw].map((c) => c.charCodeAt(0)))
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Check if a line looks like a commit header (hash|date|message)
 */
function isCommitHeader(line) {
  // Commit hash is 40 hex chars, followed by | and ISO date
  return /^[0-9a-f]{40}\|\d{4}-\d{2}-\d{2}T/.test(line)
}

/**
 * Parse git --numstat log output.
 * Structure: header line, blank, N file lines, next header...
 */
function parseNumstatLog(log) {
  /** @type {CommitInfo[]} */
  const commits = []
  const lines = log.split('\n')
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()

    // Blank line — skip (separator between header and files, or between commits)
    if (!trimmed) continue

    // Check if this is a commit header line
    if (isCommitHeader(trimmed)) {
      // Push previous commit if exists
      if (current) commits.push(current)
      const [hash, date, ...rest] = trimmed.split('|')
      current = { hash, date, message: rest.join('|'), parent: null, files: [] }
      continue
    }

    // File stat line: added\tdeleted\tpath
    if (current) {
      const parts = trimmed.split('\t')
      if (parts.length >= 3) {
        const added = parts[0] === '-' ? 0 : Number(parts[0])
        const deleted = parts[1] === '-' ? 0 : Number(parts[1])
        // Path may contain tabs for renamed files; take last part, strip quotes
        const path = decodeGitPath(parts[parts.length - 1].replace(/^"|"$/g, ''))
        current.files.push({ path, added, deleted })
      }
    }
  }

  if (current) commits.push(current)

  // Populate parent hashes (each commit's parent is the previous commit)
  for (let i = 1; i < commits.length; i++) {
    commits[i].parent = commits[i - 1].hash
  }

  return commits
}

/**
 * Get file content at a specific commit
 * @param {string} cwd
 * @param {string} commitHash
 * @param {string} filePath
 * @returns {Promise<string>}
 */
export async function getFileContent(cwd, commitHash, filePath) {
  const git = simpleGit(cwd)
  try {
    return await git.show([`${commitHash}:${filePath}`])
  } catch {
    return ''
  }
}

/**
 * Count added/removed words from git word-diff porcelain output
 */
function countWordDiff(diff) {
  let added = 0
  let removed = 0

  for (const line of diff.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added += line.slice(1).split(/\s+/).filter(Boolean).length
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed += line.slice(1).split(/\s+/).filter(Boolean).length
    }
  }

  return { added, removed }
}
