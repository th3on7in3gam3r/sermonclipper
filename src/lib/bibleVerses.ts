/** Detect Bible references in transcript or caption text. */

const EXPLICIT_REF =
  /\b([1-3]?\s?(?:John|Peter|Corinthians|Timothy|Samuel|Kings|Chronicles|Psalm|Psalms|Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Ezra|Nehemiah|Esther|Job|Proverbs|Ecclesiastes|Song|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|Acts|Romans|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Titus|Philemon|Hebrews|James|Jude|Revelation))\s+(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*\d{1,3})?\b/gi;

export type DetectedVerse = {
  reference: string;
  book: string;
  chapter: string;
  verse: string;
};

export function detectBibleReferences(text: string): DetectedVerse[] {
  if (!text?.trim()) return [];
  const found: DetectedVerse[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(EXPLICIT_REF)) {
    const book = match[1].replace(/\s+/g, ' ').trim();
    const ref = `${book} ${match[2]}:${match[3]}`;
    const key = ref.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    found.push({ reference: ref, book, chapter: match[2], verse: match[3] });
  }

  return found;
}

export function formatVerseCaption(reference: string, translation = 'ESV') {
  return `— ${reference}, ${translation}`;
}
