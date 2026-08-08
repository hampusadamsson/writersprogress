/**
 * Text analysis for markdown files — Swedish and English.
 * Readability, style, vocabulary richness, emotion.
 */

// ── Language dictionaries ──

const DICT = {
  swedish: {
    adverbs: new Set([
      'inte', 'mycket', 'så', 'nu', 'där', 'här', 'då', 'hur', 'när',
      'alltid', 'aldrig', 'ofta', 'snabbt', 'långsamt', 'gärna', 'bara',
      'nog', 'väl', 'ju', 'också', 'redan', 'fortfarande', 'kanske',
      'ganska', 'riktigt', 'helt', 'nästan', 'precis', 'särskilt',
      'speciellt', 'troligen', 'naturligtvis', 'egentligen', 'verkligen',
      'äntligen', 'förstås', 'dessutom', 'emellertid', 'dock', 'nämligen',
      'således', 'alltså', 'tillsammans', 'fram', 'tillbaka', 'hem',
      'bort', 'dit', 'hit', 'upp', 'ner', 'ut', 'in', 'iväg', 'vidare',
      'fort', 'allt', 'litet', 'lite', 'mindre', 'mer', 'mest', 'minst',
      'ändå', 'trots', 'sedan', 'sen', 'kvar', 'igen', 'visst',
      'tyvärr', 'lyckligtvis', 'möjligen', 'möjligtvis', 'knappt',
      'nätt', 'nära', 'plötsligt', 'genast', 'omedelbart', 'ständigt',
      'stillasittande', 'försiktigt', 'tyst', 'högt', 'lågt', 'lugnt',
      'sakta', 'förgäves', 'faktiskt', 'överhuvudtaget', 'huvudsakligen',
      'huvudsakligt', 'antagligen', 'förmodligen', 'tillfälligt',
      'fullständigt', 'total', 'totalt', 'ordentligt', 'tydligt',
      'varsamt', 'häftigt', 'våldsamt', 'envist', 'ilsket', 'trött',
      'glatt', 'sorgset', 'argt', 'bestämt', 'lätt', 'tungt', 'hårt',
      'mjukt', 'varmt', 'kallt', 'öppet', 'slutet', 'tydligtvis',
      'uppenbarligen', 'självklart', 'givetvis', 'onekligen',
      'oundvikligen', 'förhoppningsvis', 'förvånansvärt', 'märkligt',
    ]),
    sPassiveRe: /\b\w+(as|es|os|ås|äs|ös|des|tes|its|ats|ets|uts)\b/i,
    passiveAux: new Set([
      'blir', 'blev', 'blivit', 'är', 'var', 'vara', 'vore',
      'måste', 'skall', 'ska', 'kommer', 'bör', 'kan', 'kunde', 'får', 'må',
      'hade', 'har', 'haft', 'bliva', 'blevo',
    ]),
    pastPartRe: /(ad|at|dd|tt|en|et|na|de|da|te|ts)$/i,
    positive: new Set([
      'bra', 'vacker', 'vackert', 'vackra', 'fin', 'fint', 'fina',
      'god', 'gott', 'goda', 'glad', 'glatt', 'glada', 'lycklig',
      'lyckligt', 'lyckliga', 'älskar', 'älskade', 'älskat', 'kärlek',
      'underbar', 'underbart', 'underbara', 'fantastisk', 'fantastiskt',
      'fantastiska', 'strålande', 'ljus', 'ljust', 'ljusa', 'varm',
      'varmt', 'varma', 'stark', 'starkt', 'starka', 'fri', 'fritt',
      'fria', 'frihet', 'hopp', 'hoppfull', 'skön', 'skönt', 'sköna',
      'lycka', 'glädje', 'leende', 'log', 'ler', 'skratt', 'skrattade',
      'skrattar', 'tacksam', 'tacksamt', 'nöjd', 'nöjda', 'nöjt',
      'stolt', 'stolta', 'njuta', 'njöt', 'njuter', 'älska', 'vän',
      'vänlig', 'trygg', 'tryggt', 'trygga', 'seger', 'vinst', 'framgång',
      'lyckades', 'lyckas', 'mäster', 'mästerlig', 'blom', 'blomma',
      'blommar', 'sång', 'sjöng', 'sjunger', 'musik', 'dans', 'fest',
      'guld', 'silver', 'glitter', 'gläns', 'stråla', 'glans', 'praktfull',
      'magnifik', 'härlig', 'härligt', 'härliga', 'ljuvlig', 'ljuvligt',
      'älskvärd', 'älskvärt', 'förtjusande', 'utsökt', 'perfekt',
      'perfekta', 'idealisk', 'idealiskt', 'beundransvärd', 'imponerande',
      'behaglig', 'behagligt', 'angenäm', 'angenämt', 'tröstande',
      'hoppfullt', 'inspirerande', 'glädjande', 'upplyftande',
      'välsignad', 'välsignat', 'lyckliggjord', 'salig', 'saligt',
      'harmonisk', 'harmoniskt', 'fridfull', 'fridfullt', 'levande',
      'blomstrande', 'vital', 'energisk', 'energiskt', 'kraftfull',
      'kraftfullt', 'mäktig', 'mäktigt', 'storslagen', 'storslaget',
      'ärofull', 'ärofyllt', 'hedrande',
    ]),
    negative: new Set([
      'dålig', 'dåligt', 'dåliga', 'illa', 'sämre', 'sämst', 'ful',
      'fult', 'fula', 'mörk', 'mörkt', 'mörka', 'mörker', 'kall',
      'kallt', 'kalla', 'ensam', 'ensamt', 'ensamma', 'sorg', 'sorglig',
      'ledsen', 'ledsamt', 'ledsna', 'grät', 'gråter', 'tår', 'tårar',
      'död', 'dött', 'döda', 'dog', 'dör', 'smärta', 'ont', 'värk',
      'skada', 'skadad', 'blod', 'blodig', 'sår', 'sårad', 'sårade',
      'hat', 'hatar', 'hatade', 'ondska', 'ond', 'rädsla', 'rädd',
      'rädda', 'fruktan', 'fruktade', 'skräck', 'hemsk', 'hemskt',
      'hemska', 'fasansfull', 'fasansfullt', 'grym', 'grymt', 'grymma',
      'brutal', 'brutalt', 'hot', 'hota', 'hotade', 'hotar', 'fara',
      'farlig', 'farligt', 'farliga', 'krig', 'strid', 'slag', 'slåss',
      'slog', 'slår', 'våld', 'våldsam', 'våldsamt', 'svek', 'sviken',
      'sviker', 'förräderi', 'förrådd', 'lögn', 'ljög', 'ljuger',
      'elände', 'misär', 'olycka', 'olycklig', 'katastrof', 'förlust',
      'förlorade', 'förlorat', 'tom', 'tomt', 'tomma', 'tomhet', 'tung',
      'tungt', 'tunga', 'hård', 'hårt', 'hårda', 'tystnad', 'tyst',
      'tysta', 'skrek', 'skriker', 'ropade', 'raseri', 'arg', 'arga',
      'ilska', 'äcklig', 'äckligt', 'vidrig', 'vidrigt', 'avskyvärd',
      'avskyvärt', 'motbjudande', 'fruktansvärd', 'fruktansvärt',
      'outhärdlig', 'outhärdligt', 'plågsam', 'plågsamt', 'smärtsam',
      'smärtsamt', 'lidande', 'plåga', 'plågad', 'ångest', 'förtvivlan',
      'förtvivlad', 'hopplös', 'hopplöst', 'meningslös', 'meningslöst',
      'värdelös', 'värdelöst', 'usel', 'uselt', 'bedrövlig', 'bedrövligt',
      'sorgesam', 'sorgesamt', 'tragisk', 'tragiskt', 'sorgsen',
      'sorgset', 'olycksalig', 'olycksaligt', 'dyster', 'dystert',
      'miserabel', 'miserabelt', 'skrämmande', 'skräckinjagande',
      'fasaväckande', 'avsky', 'avskydde', 'förakt', 'föraktade',
      'äckel', 'vämjelse', 'vanära', 'skam', 'skamlig', 'skamligt',
      'förnedrande', 'kränkande', 'svekfull', 'svekfullt',
      'bedragen', 'bedraget', 'sviken', 'övergiven', 'övergivet',
      'ensamt', 'isolerad', 'isolerat',
    ]),
    nonName: new Set([
      'han', 'hon', 'hen', 'den', 'det', 'de', 'dem', 'jag', 'mig',
      'dig', 'sig', 'vi', 'ni', 'er', 'oss', 'man', 'en', 'ett',
      'mina', 'dina', 'sina', 'vår', 'våra', 'deras', 'hans', 'hennes',
      'detta', 'dessa', 'denna', 'därför', 'sedan', 'plötsligt', 'genast',
      'kanske', 'alltid', 'aldrig', 'ofta', 'ibland', 'redan',
      'fortfarande', 'ändå', 'trots', 'utan', 'eller', 'men', 'och',
      'att', 'som', 'när', 'då', 'nu', 'där', 'här', 'hur', 'varför',
      'vad', 'vem', 'för', 'till', 'från', 'med', 'vid', 'av', 'på',
      'om', 'under', 'över', 'mellan', 'genom', 'första', 'andra',
      'tredje', 'sista', 'någon', 'något', 'några', 'ingen', 'inget',
      'inga', 'alla', 'allt', 'hela', 'många', 'flera', 'varje', 'var',
      'samma', 'själv', 'bara', 'nog', 'visst', 'ju', 'väl', 'också',
      'inte', 'mycket', 'litet', 'mer', 'mest', 'du', 'din', 'ditt',
      'era', 'ert', 'eh', 'ah', 'åh', 'oh', 'äh', 'öh', 'hm', 'mm',
      'ja', 'nej', 'jo', 'nå', 'tack', 'därefter', 'någonstans',
      'himlens', 'herre', 'fan', 'jävlar', 'satans', 'någonting',
      'ingenting', 'allting', 'huruvida', 'hurudant', 'emedan',
      'likväl', 'därhän', 'varifrån', 'vartill', 'varigenom',
      'härom', 'därom', 'varom', 'varav', 'varvid', 'därvid',
      'härvid', 'härifrån', 'därifrån', 'dess', 'dessas',
      'densamma', 'detsamma', 'desamma', 'varandra',
      'åtminstone', 'knappast', 'månne', 'icke', 'ej',
      'framför', 'bakom', 'bredvid', 'innanför', 'utanför',
      'ovanför', 'nedanför', 'inuti', 'utanpå',
    ]),
  },

  english: {
    adverbs: new Set([
      'not', 'very', 'so', 'now', 'then', 'there', 'here', 'how', 'when',
      'always', 'never', 'often', 'quickly', 'slowly', 'gladly', 'just',
      'really', 'quite', 'already', 'still', 'maybe', 'perhaps', 'almost',
      'exactly', 'especially', 'probably', 'naturally', 'actually',
      'finally', 'therefore', 'however', 'thus', 'together', 'forward',
      'back', 'home', 'away', 'up', 'down', 'out', 'in', 'off', 'on',
      'further', 'fast', 'all', 'little', 'less', 'more', 'most', 'least',
      'yet', 'again', 'perhaps', 'possibly', 'suddenly', 'immediately',
      'constantly', 'carefully', 'quietly', 'loudly', 'softly', 'calmly',
      'vainly', 'truly', 'indeed', 'mainly', 'mostly', 'somewhat',
      'rather', 'too', 'enough', 'once', 'twice', 'ever', 'seldom',
      'rarely', 'usually', 'certainly', 'clearly', 'simply', 'hardly',
      'barely', 'scarcely', 'merely', 'nearly', 'deeply', 'fully',
      'greatly', 'highly', 'strongly', 'surely', 'absolutely', 'entirely',
      'completely', 'totally', 'partially', 'partly', 'wholly',
      'thoroughly', 'utterly', 'extremely', 'immensely', 'terribly',
      'awfully', 'incredibly', 'remarkably', 'surprisingly', 'strangely',
      'oddly', 'curiously', 'fortunately', 'unfortunately', 'luckily',
      'unluckily', 'obviously', 'apparently', 'evidently', 'seemingly',
      'presumably', 'undoubtedly', 'doubtless', 'definitely', 'surely',
      'certainly', 'plainly', 'visibly', 'noticeably', 'considerably',
      'significantly', 'slightly', 'barely', 'hardly', 'scarcely',
      'readily', 'willingly', 'eagerly', 'hesitantly', 'reluctantly',
      'patiently', 'anxiously', 'nervously', 'frantically', 'wildly',
      'fiercely', 'violently', 'savagely', 'brutally', 'tenderly',
      'gently', 'firmly', 'sternly', 'harshly', 'coldly', 'warmly',
      'politely', 'rudely', 'kindly', 'cruelly', 'honestly', 'truthfully',
      'falsely', 'wrongly', 'rightly', 'justly', 'fairly', 'unfairly',
    ]),
    sPassiveRe: null,
    passiveAux: new Set([
      'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
      'get', 'gets', 'got', 'gotten', 'become', 'became',
      'has', 'have', 'had', 'having',
    ]),
    pastPartRe: /(ed|en|wn|pt|nt|lt|st|ft|kt|un|wn|t|ed)[.,;:!?]?$/i,
    positive: new Set([
      'good', 'beautiful', 'nice', 'fine', 'great', 'happy', 'joy',
      'joyful', 'love', 'loved', 'loving', 'wonderful', 'fantastic',
      'brilliant', 'radiant', 'light', 'bright', 'warm', 'strong',
      'free', 'freedom', 'hope', 'hopeful', 'lovely', 'joy', 'smile',
      'smiled', 'laugh', 'laughed', 'grateful', 'satisfied', 'proud',
      'enjoy', 'enjoyed', 'friend', 'friendly', 'safe', 'victory',
      'success', 'succeeded', 'master', 'masterful', 'bloom', 'blossom',
      'song', 'sang', 'sing', 'music', 'dance', 'party', 'gold',
      'silver', 'glitter', 'shine', 'glorious', 'magnificent',
      'delight', 'delightful', 'charming', 'gorgeous', 'splendid',
      'superb', 'excellent', 'kind', 'gentle', 'sweet', 'tender',
      'bless', 'blessed', 'grace', 'peace', 'peaceful', 'serene',
      'adore', 'adored', 'cherish', 'cherished', 'treasure', 'precious',
      'darling', 'beloved', 'divine', 'heavenly', 'sublime', 'exquisite',
      'elegant', 'graceful', 'noble', 'valiant', 'heroic', 'courageous',
      'bold', 'brave', 'daring', 'gallant', 'triumph', 'triumphant',
      'cheerful', 'jolly', 'merry', 'elated', 'ecstatic', 'thrilled',
      'overjoyed', 'jubilant', 'exultant', 'glowing', 'luminous',
      'shining', 'sparkling', 'dazzling', 'brilliant', 'vivid',
      'vibrant', 'fresh', 'flourishing', 'thriving', 'prosperous',
      'rich', 'abundant', 'plentiful', 'bountiful', 'generous',
      'compassionate', 'merciful', 'forgiving', 'gracious',
      'faith', 'faithful', 'loyal', 'devoted', 'steadfast',
      'honest', 'honorable', 'righteous', 'virtuous', 'pure',
      'innocent', 'gentle', 'meek', 'humble', 'modest',
    ]),
    negative: new Set([
      'bad', 'worse', 'worst', 'ugly', 'dark', 'darkness', 'cold',
      'alone', 'lonely', 'sorrow', 'sad', 'cried', 'cry', 'tears',
      'tear', 'dead', 'death', 'died', 'die', 'dying', 'pain', 'hurt',
      'ache', 'wound', 'wounded', 'blood', 'bloody', 'hatred', 'hate',
      'hated', 'evil', 'fear', 'afraid', 'terror', 'horrible', 'terrible',
      'dreadful', 'cruel', 'brutal', 'threat', 'threaten', 'danger',
      'dangerous', 'war', 'battle', 'fight', 'fought', 'violence',
      'violent', 'betray', 'betrayed', 'lie', 'lied', 'misery', 'tragedy',
      'loss', 'lost', 'empty', 'emptiness', 'heavy', 'hard', 'silence',
      'silent', 'scream', 'screamed', 'rage', 'angry', 'anger', 'suffer',
      'suffering', 'despair', 'ruin', 'ruined', 'corpse', 'poison',
      'monster', 'demon', 'ghost', 'curse', 'cursed', 'disgusting',
      'vile', 'foul', 'repulsive', 'revolting', 'horrific', 'hideous',
      'grotesque', 'monstrous', 'fiendish', 'diabolical', 'wicked',
      'sinister', 'malicious', 'malevolent', 'vicious', 'savage',
      'merciless', 'ruthless', 'pitiless', 'heartless', 'coldhearted',
      'dismal', 'gloomy', 'bleak', 'grim', 'dreary', 'desolate',
      'barren', 'wretched', 'miserable', 'pathetic', 'pitiful',
      'hopeless', 'helpless', 'powerless', 'weak', 'feeble', 'frail',
      'sick', 'sickly', 'diseased', 'rotting', 'decaying', 'festering',
      'corrupt', 'corrupted', 'tainted', 'polluted', 'defiled',
      'shame', 'shameful', 'disgrace', 'disgraceful', 'dishonor',
      'humiliation', 'humiliated', 'degraded', 'broken', 'shattered',
      'crushed', 'destroyed', 'devastated', 'ravaged', 'scorched',
      'burnt', 'burning', 'choking', 'drowning', 'suffocating',
      'mourn', 'mourning', 'grief', 'grieving', 'weeping', 'sobbing',
      'wailing', 'lament', 'lamenting', 'anguish', 'torment',
      'tortured', 'agonized', 'agonizing',
    ]),
    nonName: new Set([
      'he', 'she', 'it', 'they', 'them', 'i', 'me', 'you', 'we', 'us',
      'my', 'your', 'his', 'her', 'our', 'their', 'its', 'this', 'that',
      'these', 'those', 'therefore', 'then', 'suddenly', 'immediately',
      'maybe', 'always', 'never', 'often', 'sometimes', 'already',
      'still', 'yet', 'without', 'or', 'but', 'and', 'as', 'when',
      'now', 'there', 'here', 'how', 'why', 'what', 'who', 'for', 'to',
      'from', 'with', 'by', 'of', 'on', 'about', 'under', 'over',
      'between', 'through', 'first', 'second', 'third', 'last', 'some',
      'any', 'no', 'none', 'all', 'every', 'each', 'many', 'several',
      'same', 'self', 'just', 'very', 'also', 'not', 'much', 'little',
      'more', 'most', 'a', 'an', 'the', 'oh', 'ah', 'um', 'uh', 'yes',
      'no', 'well', 'thanks', 'after', 'somewhere', 'heaven', 'lord',
      'hell', 'damn', 'bloody', 'thereupon', 'whereupon', 'thereafter',
      'meanwhile', 'nonetheless', 'nevertheless', 'although', 'though',
      'unless', 'until', 'while', 'whilst', 'because', 'since', 'before',
      'after', 'above', 'below', 'beneath', 'beside', 'besides',
      'beyond', 'during', 'among', 'amongst', 'toward', 'towards',
      'onto', 'into', 'upon', 'within', 'without', 'except', 'besides',
      'despite', 'notwithstanding', 'regarding', 'concerning',
      'another', 'other', 'others', 'such', 'whatever', 'whichever',
      'whoever', 'whomever', 'whose', 'whom', 'anyone', 'anybody',
      'anything', 'someone', 'somebody', 'something', 'everyone',
      'everybody', 'everything', 'nobody', 'noone', 'nothing',
      'anywhere', 'everywhere', 'nowhere', 'rather', 'quite',
      'somehow', 'anyhow', 'anyway', 'else', 'otherwise',
    ]),
  },
}

// ── Language detection ──

const SW_MARKERS = ['och','att','det','en','som','är','jag','han','hon','inte','med','för','till','den','ett','har','var','men','om','de','på','av','sig','skulle','eller','än','efter','är','när','då','vad','hur']
const EN_MARKERS = ['the','and','that','was','for','are','with','his','they','this','have','from','had','not','but','you','all','were','when','there','their','been','would','could','should','will','can','its','than','or']

export function detectLanguage(text) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length < 20) return /[åäöÅÄÖ]/.test(text) ? 'swedish' : 'english'

  let sw = 0
  let en = 0
  for (const w of words) {
    if (SW_MARKERS.includes(w)) sw++
    if (EN_MARKERS.includes(w)) en++
  }

  if (sw > en * 1.5) return 'swedish'
  if (en > sw * 1.5) return 'english'
  return /[åäöÅÄÖ]/.test(text) ? 'swedish' : 'english'
}

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
  const splitter = /[.!?]+[\s\n]+(?=[A-ZÅÄÖÉ0-9])/g
  return cleaned.split(splitter).filter((s) => s.trim().length > 0)
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

export function calcFleschSwedish(wordCount, sentenceCount, longWordCount) {
  if (sentenceCount === 0 || wordCount === 0) return 0
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

export function calcSentenceLengthStdDev(text) {
  const sentences = getSentences(text)
  if (sentences.length < 2) return 0
  const lengths = sentences.map((s) => s.split(/\s+/).filter(Boolean).length)
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length
  return Math.round(Math.sqrt(variance) * 10) / 10
}

// ── Passive voice ──

export function countPassiveVerbs(text, lang = 'swedish') {
  const d = DICT[lang] || DICT.swedish
  const words = getWords(stripMarkdown(text))
  let count = 0

  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    if (d.sPassiveRe && d.sPassiveRe.test(w)) {
      count++
      continue
    }
    if (d.passiveAux.has(w.toLowerCase()) && i + 1 < words.length) {
      const next = words[i + 1]
      if (d.pastPartRe.test(next)) {
        count++
      }
    }
  }

  return count
}

export function calcPassiveRatio(passiveCount, wordCount) {
  if (!wordCount) return 0
  return Math.round((passiveCount / wordCount) * 1000) / 10
}

// ── Adverb ratio ──

export function countAdverbs(text, lang = 'swedish') {
  const d = DICT[lang] || DICT.swedish
  const words = getWords(stripMarkdown(text))
  let count = 0
  for (const w of words) {
    const lower = w.toLowerCase()
    if (d.adverbs.has(lower)) {
      count++
    } else if (lang === 'swedish') {
      if (lower.endsWith('vis') || lower.endsWith('ligen') || lower.endsWith('tvis')) {
        count++
      } else if (/^\w+[a-zåäö]t$/i.test(lower) && !lower.endsWith('et') && !lower.endsWith('at') && lower.length > 3) {
        count++
      }
    } else {
      if (lower.endsWith('ly') && lower.length > 4) count++
    }
  }
  return count
}

export function calcAdverbRatio(adverbCount, wordCount) {
  if (!wordCount) return 0
  return Math.round((adverbCount / wordCount) * 1000) / 10
}

// ── Vocabulary richness ──

export function calcTTR(words) {
  if (!words.length) return 0
  const unique = new Set(words.map((w) => w.toLowerCase()))
  return Math.round((unique.size / words.length) * 1000) / 10
}

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

export function calcHonoreR(wordCount, uniqueCount, hapaxCount) {
  if (wordCount === 0 || uniqueCount === 0) return 0
  if (hapaxCount === uniqueCount) return 0
  const r = (100 * Math.log(wordCount)) / (1 - hapaxCount / uniqueCount)
  return Math.round(r * 10) / 10
}

// ── Word frequency ──

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

export function calcSentiment(text, lang = 'swedish') {
  const d = DICT[lang] || DICT.swedish
  const words = getWords(stripMarkdown(text))
  let positive = 0
  let negative = 0

  for (const w of words) {
    const lower = w.toLowerCase()
    if (d.positive.has(lower)) positive++
    if (d.negative.has(lower)) negative++
  }

  const total = positive + negative
  const polarity = total > 0 ? Math.round(((positive - negative) / total) * 100) : 0
  const density = words.length > 0 ? Math.round((total / words.length) * 1000) / 10 : 0

  return { positive, negative, polarity, density }
}

// ── Entity extraction ──

export function extractEntities(text, lang = 'swedish') {
  const d = DICT[lang] || DICT.swedish
  const cleaned = stripMarkdown(text)
  const capitalizedRe = /\b([A-ZÅÄÖÉ][a-zåäöé]+(?:\s+[A-ZÅÄÖÉ][a-zåäöé]+){0,2})\b/g
  const candidates = new Map()
  let match
  // biome-ignore lint/suspicious/noAssignInExpressions: regex exec pattern
  while ((match = capitalizedRe.exec(cleaned)) !== null) {
    const entity = match[1]
    const firstWord = entity.split(/\s+/)[0].toLowerCase()
    if (!entity.includes(' ') && d.nonName.has(firstWord)) continue
    if (entity.length < 2) continue
    candidates.set(entity, (candidates.get(entity) || 0) + 1)
  }
  return Object.fromEntries(candidates)
}

// ── Combined analysis ──

export function analyzeText(text, lang) {
  if (!lang) lang = detectLanguage(text)

  const cleaned = stripMarkdown(text)
  const words = getWords(cleaned)
  const wordCount = words.length
  const sentenceCount = countSentences(text)
  const longWordCount = countLongWords(text)
  const dialogueLines = countDialogueLines(text)
  const contentLines = countContentLines(text)
  const paragraphCount = countParagraphs(text)
  const entities = extractEntities(text, lang)
  const passiveCount = countPassiveVerbs(text, lang)
  const adverbCount = countAdverbs(text, lang)
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
  const sentiment = calcSentiment(text, lang)

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
