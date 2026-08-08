import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  detectLanguage,
  analyzeText,
  countWords,
  countSentences,
  countLongWords,
  calcLix,
  countPassiveVerbs,
  countAdverbs,
  calcSentiment,
  extractEntities,
  calcTTR,
  countHapaxLegomena,
} from './lib/textstats.mjs'

describe('detectLanguage', () => {
  it('detects Swedish from short text with åäö', () => {
    assert.strictEqual(detectLanguage('Jag är här'), 'swedish')
  })

  it('detects English from short text without åäö', () => {
    assert.strictEqual(detectLanguage('I am here'), 'english')
  })

  it('detects Swedish from function word frequency', () => {
    const sw = 'Det var en gång en kung som bodde i ett stort slott. Han hade tre döttrar och de var mycket vackra. Men en dag kom en drake och tog dem.'
    assert.strictEqual(detectLanguage(sw), 'swedish')
  })

  it('detects English from function word frequency', () => {
    const en = 'Once upon a time there was a king who lived in a great castle. He had three daughters and they were very beautiful. But one day a dragon came and took them away.'
    assert.strictEqual(detectLanguage(en), 'english')
  })

  it('falls back to åäö check on ambiguous text', () => {
    assert.strictEqual(detectLanguage('hej då'), 'swedish')
  })
})

describe('analyzeText', () => {
  const swText = `Han gick långsamt genom skogen. Det var vackert och tyst. Plötsligt hörde han ett skrik. Han sprang snabbt mot ljudet.`
  const enText = `He walked slowly through the forest. It was beautiful and quiet. Suddenly he heard a scream. He ran quickly toward the sound.`

  it('auto-detects Swedish and returns stats', () => {
    const stats = analyzeText(swText)
    assert.ok(stats.wordCount > 0)
    assert.ok(stats.sentenceCount > 0)
    assert.ok(typeof stats.lix === 'number')
    assert.ok(typeof stats.adverbRatio === 'number')
    assert.ok(typeof stats.passiveRatio === 'number')
    assert.ok(typeof stats.sentimentPolarity === 'number')
  })

  it('auto-detects English and returns stats', () => {
    const stats = analyzeText(enText)
    assert.ok(stats.wordCount > 0)
    assert.ok(stats.sentenceCount > 0)
    assert.ok(typeof stats.lix === 'number')
    assert.ok(typeof stats.adverbRatio === 'number')
    assert.ok(typeof stats.passiveRatio === 'number')
    assert.ok(typeof stats.sentimentPolarity === 'number')
  })

  it('accepts explicit language param', () => {
    const sw = analyzeText(swText, 'swedish')
    const en = analyzeText(enText, 'english')
    assert.ok(sw.wordCount > 0)
    assert.ok(en.wordCount > 0)
  })
})

describe('countAdverbs', () => {
  it('counts Swedish adverbs', () => {
    const text = 'Han gick långsamt och tyst genom skogen. Plötsligt skrek han högt.'
    const count = countAdverbs(text, 'swedish')
    assert.ok(count >= 3) // långsamt, tyst, plötsligt, högt
  })

  it('counts English adverbs', () => {
    const text = 'He walked slowly and quietly through the forest. Suddenly he screamed loudly.'
    const count = countAdverbs(text, 'english')
    assert.ok(count >= 3) // slowly, quietly, suddenly, loudly
  })

  it('catches -ly suffix adverbs in English', () => {
    const text = 'She carefully placed the beautifully wrapped gift gently on the table.'
    const count = countAdverbs(text, 'english')
    assert.ok(count >= 3) // carefully, beautifully, gently
  })

  it('returns 0 for text without adverbs', () => {
    const text = 'the cat sat near the mat inside the room'
    assert.strictEqual(countAdverbs(text, 'english'), 0)
  })
})

describe('countPassiveVerbs', () => {
  it('detects Swedish S-passive', () => {
    const text = 'Dörren öppnades och ljuset tändes. Maten serverades.'
    const count = countPassiveVerbs(text, 'swedish')
    assert.ok(count >= 2) // öppnades, tändes, serverades
  })

  it('detects Swedish periphrastic passive', () => {
    const text = 'Han blev slagen av vågen. Hon är älskad av alla.'
    const count = countPassiveVerbs(text, 'swedish')
    assert.ok(count >= 2) // blev slagen, är älskad
  })

  it('detects English passive', () => {
    const text = 'The door was opened and the light was turned on. The meal was served.'
    const count = countPassiveVerbs(text, 'english')
    assert.ok(count >= 3) // was opened, was turned, was served
  })

  it('returns 0 for active text', () => {
    assert.strictEqual(countPassiveVerbs('he opened the door and turned on the light', 'english'), 0)
  })
})

describe('calcSentiment', () => {
  it('detects positive Swedish sentiment', () => {
    const text = 'Hon var glad och lycklig. Solen sken vackert och allt var underbart.'
    const result = calcSentiment(text, 'swedish')
    assert.ok(result.positive > result.negative)
    assert.ok(result.polarity > 0)
  })

  it('detects negative Swedish sentiment', () => {
    const text = 'Han var ledsen och arg. Mörkret omgav honom och han kände sig ensam och rädd.'
    const result = calcSentiment(text, 'swedish')
    assert.ok(result.negative > result.positive)
    assert.ok(result.polarity < 0)
  })

  it('detects positive English sentiment', () => {
    const text = 'She was happy and joyful. The sun shone beautifully and everything was wonderful.'
    const result = calcSentiment(text, 'english')
    assert.ok(result.positive > result.negative)
    assert.ok(result.polarity > 0)
  })

  it('detects negative English sentiment', () => {
    const text = 'He was sad and angry. The darkness surrounded him and he felt alone and afraid.'
    const result = calcSentiment(text, 'english')
    assert.ok(result.negative > result.positive)
    assert.ok(result.polarity < 0)
  })

  it('returns polarity 0 for neutral text', () => {
    const text = 'The table is made of wood. It has four legs. The room is quiet.'
    const result = calcSentiment(text, 'english')
    assert.strictEqual(result.polarity, 0)
    assert.strictEqual(result.positive, 0)
    assert.strictEqual(result.negative, 0)
  })
})

describe('extractEntities', () => {
  it('extracts Swedish character names', () => {
    const text = 'Balder gick genom skogen. Han mötte Romulus och Cassia. Kejsare Noctavius såg allt från sin tron.'
    const entities = extractEntities(text, 'swedish')
    // Should find Balder, Romulus, Cassia, Kejsare Noctavius
    assert.ok(Object.keys(entities).length >= 3)
  })

  it('filters out Swedish stop words', () => {
    const text = 'Han gick. Hon sprang. Det regnade. Jag såg.'
    const entities = extractEntities(text, 'swedish')
    assert.strictEqual(Object.keys(entities).length, 0)
  })

  it('extracts English character names', () => {
    const text = 'Arthur walked through the forest. He met Merlin and Guinevere. King Uther watched from his throne.'
    const entities = extractEntities(text, 'english')
    assert.ok(Object.keys(entities).length >= 3)
  })

  it('filters out English stop words', () => {
    const text = 'He walked. She ran. It rained. I watched.'
    const entities = extractEntities(text, 'english')
    assert.strictEqual(Object.keys(entities).length, 0)
  })
})

describe('readability', () => {
  it('calcLix returns higher value for complex text', () => {
    const simple = 'The cat sat on the mat. It was a nice day.'
    const complex = 'The extraordinarily sophisticated feline positioned itself upon the meticulously woven carpet as meteorological conditions proved favorable.'
    assert.ok(calcLix(countWords(complex), countSentences(complex), countLongWords(complex)) >
              calcLix(countWords(simple), countSentences(simple), countLongWords(simple)))
  })

  it('calcTTR returns lower value for repetitive text', () => {
    const varied = 'The quick brown fox jumps over the lazy dog'
    const repetitive = 'the the the the the the the the the the'
    assert.ok(calcTTR(varied.split(/\s+/)) > calcTTR(repetitive.split(/\s+/)))
  })

  it('countHapaxLegomena counts words appearing exactly once', () => {
    const words = ['cat', 'dog', 'cat', 'bird', 'dog', 'fish']
    assert.strictEqual(countHapaxLegomena(words), 2) // bird, fish
  })
})
