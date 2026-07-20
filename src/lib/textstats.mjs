/**
 * Swedish text analysis for markdown files.
 * Readability, style, vocabulary richness, emotion.
 */

// ── Swedish constants ──

/** Common Swedish adverbs */
const SWEDISH_ADVERBS = new Set([
  'inte',
  'mycket',
  'så',
  'nu',
  'där',
  'här',
  'då',
  'hur',
  'när',
  'alltid',
  'aldrig',
  'ofta',
  'snabbt',
  'långsamt',
  'gärna',
  'bara',
  'nog',
  'väl',
  'ju',
  'också',
  'redan',
  'fortfarande',
  'kanske',
  'ganska',
  'riktigt',
  'helt',
  'nästan',
  'precis',
  'särskilt',
  'speciellt',
  'troligen',
  'naturligtvis',
  'egentligen',
  'verkligen',
  'äntligen',
  'förstås',
  'dessutom',
  'emellertid',
  'dock',
  'nämligen',
  'således',
  'alltså',
  'tillsammans',
  'ganska',
  'nästan',
  'fram',
  'tillbaka',
  'hem',
  'bort',
  'dit',
  'hit',
  'upp',
  'ner',
  'ut',
  'in',
  'iväg',
  'vidare',
  'fort',
  'allt',
  'litet',
  'lite',
  'mindre',
  'mer',
  'mest',
  'minst',
  'ändå',
  'trots',
  'sedan',
  'sen',
  'kvar',
  'igen',
  'ändå',
  'nog',
  'visst',
  'väl',
  'ju',
  'nog',
  'tyvärr',
  'lyckligtvis',
  'möjligen',
  'möjligtvis',
  'knappt',
  'nätt',
  'nära',
  'plötsligt',
  'genast',
  'omedelbart',
  'ständigt',
  'stillasittande',
  'försiktigt',
  'tyst',
  'högt',
  'lågt',
  'lugnt',
  'sakta',
  'förgäves',
  'verkligen',
  'faktiskt',
  'överhuvudtaget',
  'huvudsakligen',
  'huvudsakligt',
])

/** S-passive endings */
const S_PASSIVE_RE = /\b\w+(as|es|os|ås|äs|ös|des|tes|its|ats|ets|its|uts)\b/i

/** Periphrastic passive auxiliaries */
const PASSIVE_AUX = new Set([
  'blir',
  'blev',
  'blivit',
  'är',
  'var',
  'vara',
  'vore',
  'måste',
  'skall',
  'ska',
  'kommer',
  'bör',
  'kan',
  'kunde',
  'får',
  'må',
])

/** Past participle endings (common) */
const PAST_PART_RE = /(ad|at|dd|tt|en|et|na|de|da|te|ts)$/i

/** Positive sentiment words (Swedish) */
const POSITIVE_WORDS = new Set([
  'bra',
  'vacker',
  'vackert',
  'vackra',
  'fin',
  'fint',
  'fina',
  'god',
  'gott',
  'goda',
  'glad',
  'glatt',
  'glada',
  'lycklig',
  'lyckligt',
  'lyckliga',
  'älskar',
  'älskade',
  'älskat',
  'kärlek',
  'underbar',
  'underbart',
  'underbara',
  'fantastisk',
  'fantastiskt',
  'fantastiska',
  'strålande',
  'ljus',
  'ljust',
  'ljusa',
  'varm',
  'varmt',
  'varma',
  'stark',
  'starkt',
  'starka',
  'fri',
  'fritt',
  'fria',
  'frihet',
  'hopp',
  'hoppfull',
  'skön',
  'skönt',
  'sköna',
  'lycka',
  'glädje',
  'leende',
  'log',
  'ler',
  'skratt',
  'skrattade',
  'skrattar',
  'tacksam',
  'tacksamt',
  'nöjd',
  'nöjda',
  'nöjt',
  'stolt',
  'stolta',
  'stolt',
  'njuta',
  'njöt',
  'njuter',
  'älska',
  'vän',
  'vänlig',
  'trygg',
  'tryggt',
  'trygga',
  'seger',
  'vinst',
  'framgång',
  'lyckades',
  'lyckas',
  'mäster',
  'mästerlig',
  'blom',
  'blomma',
  'blommar',
  'sång',
  'sjöng',
  'sjunger',
  'musik',
  'dans',
  'fest',
  'guld',
  'silver',
  'glitter',
  'gläns',
  'stråla',
  'glans',
  'praktfull',
  'magnifik',
])

/** Negative sentiment words (Swedish) */
const NEGATIVE_WORDS = new Set([
  'dålig',
  'dåligt',
  'dåliga',
  'illa',
  'sämre',
  'sämst',
  'ful',
  'fult',
  'fula',
  'mörk',
  'mörkt',
  'mörka',
  'mörker',
  'kall',
  'kallt',
  'kalla',
  'ensam',
  'ensamt',
  'ensamma',
  'sorg',
  'sorglig',
  'ledsen',
  'ledsamt',
  'ledsna',
  'grät',
  'gråter',
  'tår',
  'tårar',
  'död',
  'dött',
  'döda',
  'dog',
  'dör',
  'smärta',
  'ont',
  'värk',
  'skada',
  'skadad',
  'blod',
  'blodig',
  'sår',
  'sårad',
  'sårade',
  'hat',
  'hatar',
  'hatade',
  'ondska',
  'ond',
  'rädsla',
  'rädd',
  'rädda',
  'fruktan',
  'fruktade',
  'skräck',
  'hemsk',
  'hemskt',
  'hemska',
  'fasansfull',
  'fasansfullt',
  'grym',
  'grymt',
  'grymma',
  'brutal',
  'brutalt',
  'hot',
  'hota',
  'hotade',
  'hotar',
  'fara',
  'farlig',
  'farligt',
  'farliga',
  'krig',
  'strid',
  'slag',
  'slåss',
  'slog',
  'slår',
  'våld',
  'våldsam',
  'våldsamt',
  'svek',
  'sviken',
  'sviker',
  'förräderi',
  'förrådd',
  'lögn',
  'ljög',
  'ljuger',
  'elände',
  'misär',
  'olycka',
  'olycklig',
  'katastrof',
  'förlust',
  'förlorade',
  'förlorat',
  'tom',
  'tomt',
  'tomma',
  'tomhet',
  'tung',
  'tungt',
  'tunga',
  'hård',
  'hårt',
  'hårda',
  'tystnad',
  'tyst',
  'tysta',
  'skrek',
  'skriker',
  'ropade',
  'raseri',
  'arg',
  'arga',
  'ilska',
])

// ── Clean text ──

function stripMarkdown(text) {
  return text
    .replace(/^---[\s\S]*?---/g, '')
    .replace(/^#+\s.*$/gm, '')
    .replace(/\[\[.*?\]\]/g, ' ')
    .replace(/[*_~>`|]/g, '')
    .replace(/\[.*?\]\(.*?\)/g, ' ')
    .replace(/^\s*[-*+]\s/gm, ' ')
    .trim()
}

function getWords(text) {
  return text.split(/\s+/).filter(Boolean)
}

function getSentences(text) {
  const cleaned = stripMarkdown(text)
  if (!cleaned) return []
  return cleaned.split(/[.!?]+[\s\n]+(?=[A-ZÅÄÖ0-9])/g).filter((s) => s.trim().length > 0)
}

// ── Readability ──

export function countWords(text) {
  return getWords(stripMarkdown(text)).length
}

export function countSentences(text) {
  const s = getSentences(text)
  return s.length || 1
}

export function countLongWords(text) {
  return getWords(stripMarkdown(text)).filter((w) => w.length > 6).length
}

export function calcLix(wordCount, sentenceCount, longWordCount) {
  if (sentenceCount === 0 || wordCount === 0) return 0
  return Math.round((wordCount / sentenceCount + (longWordCount * 100) / wordCount) * 10) / 10
}

/** Flesch reading ease adapted for Swedish (Flesch-Kincaid with Swedish syllable approx) */
export function calcFleschSwedish(wordCount, sentenceCount, longWordCount) {
  if (sentenceCount === 0 || wordCount === 0) return 0
  // Approximate: use long words as proxy for complex words
  // Standard: 206.835 − 1.015(words/sentences) − 84.6(syllables/words)
  // Simplified: 206.835 − 1.015 * wps − 84.6 * (longWords/words)
  const ease = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (longWordCount / wordCount)
  return Math.round(Math.max(0, Math.min(100, ease)))
}

// ── Style ──

export function countDialogueLines(text) {
  return text.split('\n').filter((l) => /[""'\u2018\u2019]/.test(l)).length
}

export function countContentLines(text) {
  return text
    .split('\n')
    .filter(
      (l) => l.trim().length > 0 && !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('>'),
    ).length
}

export function countParagraphs(text) {
  return stripMarkdown(text)
    .split(/\n\n+/)
    .filter((p) => p.trim().length > 0).length
}

/** Sentence length variance (standard deviation) */
export function calcSentenceLengthStdDev(text) {
  const sentences = getSentences(text)
  if (sentences.length < 2) return 0
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length)
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}

// ── Passive voice ──

export function countPassiveVerbs(text) {
  const words = getWords(stripMarkdown(text))
  let count = 0

  for (let i = 0; i < words.length; i++) {
    const w = words[i]

    // S-passive: "skrivs", "görs", "byggdes", "sägs"
    if (S_PASSIVE_RE.test(w)) {
      count++
      continue
    }

    // Periphrastic: "blir skriven", "är gjord", "blev tagen"
    if (PASSIVE_AUX.has(w.toLowerCase()) && i + 1 < words.length) {
      const next = words[i + 1]
      if (PAST_PART_RE.test(next)) {
        count++
      }
    }
  }

  return count
}

export function calcPassiveRatio(passiveCount, wordCount) {
  if (!wordCount) return 0
  return Math.round((passiveCount / wordCount) * 1000) / 10 // per 1000 words
}

// ── Adverb ratio ──

export function countAdverbs(text) {
  const words = getWords(stripMarkdown(text))
  let count = 0
  for (const w of words) {
    const lower = w.toLowerCase()
    if (SWEDISH_ADVERBS.has(lower)) {
      count++
    } else if (lower.endsWith('vis') || lower.endsWith('ligen') || lower.endsWith('tvis')) {
      // "lyckligtvis", "naturligtvis", "egentligen", "möjligen"
      count++
    } else if (/^\w+[a-zåäö]t$/i.test(lower) && !lower.endsWith('et') && !lower.endsWith('at')) {
      // Neutral adjective form used adverbially: "snabbt", "långsamt", "vackert"
      // Exclude common non-adverb -t words: det, et, at, etc
      if (lower.length > 3) count++
    }
  }
  return count
}

export function calcAdverbRatio(adverbCount, wordCount) {
  if (!wordCount) return 0
  return Math.round((adverbCount / wordCount) * 1000) / 10 // per 1000 words (King rule: avoid adverbs)
}

// ── Vocabulary richness ──

/**
 * Type-Token Ratio: unique words / total words.
 * High = rich vocabulary, but sensitive to text length.
 */
export function calcTTR(words) {
  if (!words.length) return 0
  const unique = new Set(words.map((w) => w.toLowerCase()))
  return Math.round((unique.size / words.length) * 1000) / 10
}

/**
 * Hapax legomena: words used exactly once.
 */
export function countHapaxLegomena(words) {
  const freq = new Map()
  for (const w of words) {
    const lower = w.toLowerCase()
    freq.set(lower, (freq.get(lower) || 0) + 1)
  }
  let count = 0
  for (const [, n] of freq) {
    if (n === 1) count++
  }
  return count
}

/**
 * Honoré's R: lexical density measure, robust to text length.
 * R = 100 * log(N) / (1 - V1/V)  where N=total words, V=unique, V1=hapax
 */
export function calcHonoreR(wordCount, uniqueCount, hapaxCount) {
  if (wordCount === 0 || uniqueCount === 0) return 0
  if (hapaxCount === uniqueCount) return 0 // avoid division by zero
  const r = (100 * Math.log(wordCount)) / (1 - hapaxCount / uniqueCount)
  return Math.round(r * 10) / 10
}

// ── Word frequency ──

/**
 * Top-N word frequency as percentage of total words.
 * Low = varied vocabulary, high = repetitive.
 */
export function calcTopWordFrequency(words, topN = 100) {
  if (!words.length) return 0
  const freq = new Map()
  for (const w of words) {
    const lower = w.toLowerCase()
    freq.set(lower, (freq.get(lower) || 0) + 1)
  }
  const sorted = [...freq.values()].sort((a, b) => b - a)
  const topSum = sorted.slice(0, topN).reduce((s, n) => s + n, 0)
  return Math.round((topSum / words.length) * 1000) / 10
}

// ── Sentiment ──

export function calcSentiment(text) {
  const words = getWords(stripMarkdown(text))
  let positive = 0
  let negative = 0

  for (const w of words) {
    const lower = w.toLowerCase()
    if (POSITIVE_WORDS.has(lower)) positive++
    if (NEGATIVE_WORDS.has(lower)) negative++
  }

  const total = positive + negative
  const polarity = total > 0 ? Math.round(((positive - negative) / total) * 100) : 0 // -100 to 100
  const density = words.length > 0 ? Math.round((total / words.length) * 1000) / 10 : 0 // per 1000 words

  return { positive, negative, polarity, density }
}

// ── Entity extraction (smart character detection) ──

/** Words that start sentences but aren't character names */
const NON_NAME_WORDS = new Set([
  'han',
  'hon',
  'hen',
  'den',
  'det',
  'de',
  'dem',
  'jag',
  'mig',
  'dig',
  'sig',
  'vi',
  'ni',
  'er',
  'oss',
  'man',
  'en',
  'ett',
  'mina',
  'dina',
  'sina',
  'vår',
  'våra',
  'deras',
  'hans',
  'hennes',
  'detta',
  'dessa',
  'denna',
  'därför',
  'sedan',
  'plötsligt',
  'genast',
  'kanske',
  'alltid',
  'aldrig',
  'ofta',
  'ibland',
  'redan',
  'fortfarande',
  'ändå',
  'trots',
  'utan',
  'eller',
  'men',
  'och',
  'att',
  'som',
  'när',
  'då',
  'nu',
  'där',
  'här',
  'hur',
  'varför',
  'vad',
  'vem',
  'för',
  'till',
  'från',
  'med',
  'vid',
  'av',
  'på',
  'om',
  'under',
  'över',
  'mellan',
  'genom',
  'första',
  'andra',
  'tredje',
  'sista',
  'någon',
  'något',
  'några',
  'ingen',
  'inget',
  'inga',
  'alla',
  'allt',
  'hela',
  'många',
  'flera',
  'några',
  'varje',
  'var',
  'samma',
  'själv',
  'bara',
  'nog',
  'visst',
  'ju',
  'väl',
  'också',
  'inte',
  'mycket',
  'litet',
  'mer',
  'mest',
  'du',
  'din',
  'ditt',
  'era',
  'ert',
  'ni',
  'dig',
  'han',
  'hon',
  'den',
  'det',
  'de',
  'dem',
  'eh',
  'ah',
  'åh',
  'oh',
  'äh',
  'öh',
  'hm',
  'mm',
  'ja',
  'nej',
  'jo',
  'nå',
  'tack',
  'därefter',
  'någonstans',
  'himlens',
  'herre',
  'fan',
  'jävlar',
  'satans',
])

/**
 * Extract potential character names from text.
 * Finds capitalized word sequences (1-3 words), filters out common non-name words.
 */
export function extractEntities(text) {
  const cleaned = stripMarkdown(text)
  // Find all capitalized sequences: 1-3 capitalized words in a row
  const capitalizedRe = /\b([A-ZÅÄÖÉ][a-zåäöé]+(?:\s+[A-ZÅÄÖÉ][a-zåäöé]+){0,2})\b/g
  const candidates = new Map()
  let match
  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
  while ((match = capitalizedRe.exec(cleaned)) !== null) {
    const entity = match[1]
    const firstWord = entity.split(/\s+/)[0].toLowerCase()
    // Skip single-word non-names
    if (!entity.includes(' ') && NON_NAME_WORDS.has(firstWord)) continue
    // Skip very short
    if (entity.length < 2) continue
    candidates.set(entity, (candidates.get(entity) || 0) + 1)
  }
  return Object.fromEntries(candidates)
}

// ── Character mentions (legacy wiki link) ──

export function countCharacterMentions(text) {
  /** @type {Map<string, number>} */
  const mentions = new Map()
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  let match
  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim()
    mentions.set(name, (mentions.get(name) || 0) + 1)
  }
  return Object.fromEntries(mentions)
}

// ── Combined analysis ──

/**
 * Run all text stats on a markdown string
 */
export function analyzeText(text) {
  const cleaned = stripMarkdown(text)
  const words = getWords(cleaned)
  const wordCount = words.length
  const sentenceCount = countSentences(text)
  const longWordCount = countLongWords(text)
  const dialogueLines = countDialogueLines(text)
  const contentLines = countContentLines(text)
  const paragraphCount = countParagraphs(text)
  const entities = extractEntities(text)
  const passiveCount = countPassiveVerbs(text)
  const adverbCount = countAdverbs(text)
  const hapaxCount = countHapaxLegomena(words)

  const lix = calcLix(wordCount, sentenceCount, longWordCount)
  const flesch = calcFleschSwedish(wordCount, sentenceCount, longWordCount)
  const dialogueRatio = contentLines > 0 ? Math.round((dialogueLines / contentLines) * 100) : 0
  const sentenceLengthAvg =
    sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0
  const sentenceLengthStdDev = calcSentenceLengthStdDev(text)
  const passiveRatio = calcPassiveRatio(passiveCount, wordCount)
  const adverbRatio = calcAdverbRatio(adverbCount, wordCount)
  const ttr = calcTTR(words)
  const honoreR = calcHonoreR(
    wordCount,
    new Set(words.map((w) => w.toLowerCase())).size,
    hapaxCount,
  )
  const topWordFreq = calcTopWordFrequency(words, 100)
  const sentiment = calcSentiment(text)

  return {
    wordCount,
    sentenceCount,
    longWordCount,
    sentenceLengthAvg,
    sentenceLengthStdDev,
    dialogueLines,
    contentLines,
    dialogueRatio,
    paragraphCount,
    lix,
    flesch,
    passiveCount,
    passiveRatio,
    adverbCount,
    adverbRatio,
    ttr,
    hapaxCount,
    honoreR,
    topWordFreq,
    sentimentPositive: sentiment.positive,
    sentimentNegative: sentiment.negative,
    sentimentPolarity: sentiment.polarity,
    sentimentDensity: sentiment.density,
    entities,
  }
}
