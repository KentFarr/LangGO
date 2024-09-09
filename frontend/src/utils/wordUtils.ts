import wordsN1 from '../data/kanji_words_difficulty_1_n1.json';
import wordsN2 from '../data/kanji_words_difficulty_2_n2.json';
import wordsN3 from '../data/kanji_words_difficulty_3_n3.json';
import wordsN4 from '../data/kanji_words_difficulty_4_n4.json';
import wordsN5 from '../data/kanji_words_difficulty_5_n5.json';

export const allWords = [...wordsN1, ...wordsN2, ...wordsN3, ...wordsN4, ...wordsN5];

export const countWordFrequency = (
  text: string,
  words: Array<{ word: string; difficulty: number }>,
  difficultyLevel: number
) => {
  const wordCounts: { [key: string]: { count: number; difficulty: number } } = {};

  // Adjust regex for Japanese characters (Kanji, Hiragana, Katakana) and Latin characters
  const textWords = text.match(/[\u3040-\u30FF\u4E00-\u9FFF\uFF66-\uFF9D]+|[a-zA-Z0-9]+/g);

  console.log('Extracted words from text:', textWords);

  if (textWords) {
    words.forEach(({ word, difficulty }) => {
      // Filter only words with the specified difficulty level
      if (difficulty === difficultyLevel) {
        const count = textWords.filter((textWord) => textWord === word).length;

        if (count > 0) {
          wordCounts[word] = { count, difficulty };
          console.log(`Word "${word}" found ${count} times with difficulty ${difficulty}`);
        }
      }
    });
  }

  console.log('Word counts:', wordCounts);
  return wordCounts;
};

export const getTopWords = (
  wordCounts: { [key: string]: { count: number; difficulty: number } },
  topN: number = 5
) => {
  return Object.entries(wordCounts)
    .sort(([, a], [, b]) => b.count - a.count || b.difficulty - a.difficulty)
    .slice(0, topN)
    .map(([word]) => word);
};
