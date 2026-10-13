import type { GeneratedCard } from '../domain/flashcard.js';
import { RELATED_WORD_COUNT, type MnemonicGenerator } from './mnemonicGenerator.js';

/** JLPT level as used by the frontend word lists (5 = N5, easiest; 1 = N1, hardest). */
export type JlptLevel = 1 | 2 | 3 | 4 | 5;

const card = (word: string, reading: string, meaning: string, mnemonic: string) => ({
  word,
  reading,
  meaning,
  mnemonic,
});

/**
 * Hand-written cards served when no OpenAI key is configured, so the app can be tried end to
 * end for free. Each level matches the word list the frontend uses for that level.
 */
export const SAMPLE_CARDS: Record<JlptLevel, GeneratedCard[]> = {
  5: [
    card('学校', 'がっこう', 'school', 'At SCHOOL the bell rings and everyone yells "GAK! KOH!", がっこう, as they run to class.'),
    card('先生', 'せんせい', 'teacher', 'A good TEACHER has SENSE, SAY the students: せんせい knows best.'),
    card('電車', 'でんしゃ', 'train', 'The TRAIN rattles out of its DEN, SHA-king the tracks: でんしゃ.'),
    card('天気', 'てんき', 'weather', 'TEN KEYs on the forecaster\'s keyboard decide tomorrow\'s WEATHER: てんき.'),
    card('友達', 'ともだち', 'friend', 'TOMORROW, DAH-CHI says, I\'ll still be your FRIEND: ともだち.'),
    card('旅行', 'りょこう', 'trip, travel', 'On every TRIP, RYO packs a COAT: りょこう.'),
  ],
  4: [
    card('約束', 'やくそく', 'promise', 'A YAK in SOCKs PROMISEs never to take them off: やくそく.'),
    card('世界', 'せかい', 'world', 'SAY "KAI!" loud enough and the whole WORLD hears it: せかい.'),
    card('習慣', 'しゅうかん', 'habit, custom', 'Wearing SHOES in the CAN is a bad HABIT: しゅうかん.'),
    card('説明', 'せつめい', 'explanation', 'The EXPLANATION SETS the MAY deadline in stone: せつめい.'),
    card('関係', 'かんけい', 'relationship, connection', 'A CAN and a KEY have no obvious RELATIONSHIP: かんけい.'),
    card('必要', 'ひつよう', 'necessary', 'HE TOLD YOU it was NECESSARY: ひつよう.'),
  ],
  3: [
    card('自然', 'しぜん', 'nature', 'SHE finds ZEN in NATURE: しぜん.'),
    card('影響', 'えいきょう', 'influence', 'A KYOTO trip had a huge INFLUENCE on her: えいきょう.'),
    card('状況', 'じょうきょう', 'situation', 'JOE in KYOTO is in a tricky SITUATION: じょうきょう.'),
    card('環境', 'かんきょう', 'environment', 'CAN KYOTO protect its ENVIRONMENT? かんきょう.'),
    card('責任', 'せきにん', 'responsibility', 'SECK IN, sit down, and take RESPONSIBILITY: せきにん.'),
    card('努力', 'どりょく', 'effort', 'DOE and RYOKU put real EFFORT into practice: どりょく.'),
  ],
  2: [
    card('矛盾', 'むじゅん', 'contradiction', 'A MOO-ing JUNE snowstorm is a total CONTRADICTION: むじゅん.'),
    card('謙虚', 'けんきょ', 'humble, modest', 'KEN from KYOTO stays HUMBLE despite winning: けんきょ.'),
    card('普及', 'ふきゅう', 'spread, popularization', 'WHO\'S CUE started the SPREAD of the trend? ふきゅう.'),
    card('構造', 'こうぞう', 'structure', 'A COW in a ZOO examines the STRUCTURE of its pen: こうぞう.'),
    card('募集', 'ぼしゅう', 'recruitment', 'The BOSS SHOOs everyone into the RECRUITMENT drive: ぼしゅう.'),
  ],
  1: [
    card('把握', 'はあく', 'grasp, understanding', '"HA! AH, CUTE!" She finally GRASPS the joke: はあく.'),
    card('曖昧', 'あいまい', 'vague, ambiguous', '"AI, MY…" he trails off, being VAGUE again: あいまい.'),
    card('妥協', 'だきょう', 'compromise', 'DA, KYOTO it is: a fair COMPROMISE for the trip: だきょう.'),
    card('偏見', 'へんけん', 'prejudice', 'The HEN and KEN overcome their PREJUDICE against each other: へんけん.'),
    card('交渉', 'こうしょう', 'negotiation', 'The COW SHOWs up to the NEGOTIATION with demands: こうしょう.'),
    card('根拠', 'こんきょ', 'basis, grounds', 'CON-KYO? What are the GROUNDS for that claim? こんきょ.'),
  ],
};

export const SAMPLE_WORDS_BY_LEVEL = Object.fromEntries(
  Object.entries(SAMPLE_CARDS).map(([level, cards]) => [level, cards.map((c) => c.word)]),
) as Record<JlptLevel, string[]>;

const placeholder = (word: string): GeneratedCard => ({
  word,
  reading: '',
  meaning: 'Sample card',
  mnemonic:
    'LangGo is running in demo mode, so this card has no AI-generated mnemonic. ' +
    'Pick "Random words" to see complete sample cards.',
});

/** Serves sample cards instead of calling OpenAI. */
export function createDemoMnemonicGenerator(): MnemonicGenerator {
  const all = Object.values(SAMPLE_CARDS).flat();
  const byWord = new Map(all.map((c) => [c.word, c]));
  const levelOf = new Map(
    Object.entries(SAMPLE_CARDS).flatMap(([level, cards]) => cards.map((c) => [c.word, level])),
  );

  return {
    async generate(words) {
      const flashcards = words.map((word) => byWord.get(word) ?? placeholder(word));

      // Suggest other sample words from the same level as the request, like the real model would.
      const level = words.map((w) => levelOf.get(w)).find(Boolean);
      const pool = level ? SAMPLE_CARDS[Number(level) as JlptLevel] : all;
      const relatedWords = pool.filter((c) => !words.includes(c.word)).slice(0, RELATED_WORD_COUNT);

      return { flashcards, relatedWords };
    },
  };
}
