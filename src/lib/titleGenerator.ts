// Deterministic title generation — no AI needed
// Extracts keywords from messages and forms a short readable title

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
  'on', 'with', 'at', 'by', 'from', 'up', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'each',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'any',
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
  'they', 'them', 'their', 'this', 'that', 'these', 'those', 'what',
  'which', 'who', 'whom', 'and', 'but', 'or', 'nor', 'not', 'so',
  'yet', 'just', 'only', 'also', 'too', 'very', 'really', 'like',
  'anyone', 'someone', 'nobody', 'everybody', 'something', 'anything',
  'ever', 'never', 'always', 'sometimes', 'often', 'please', 'hi',
  'hey', 'hello', 'anyone', 'here', 'there', 'want', 'know', 'think',
  'need', 'going', 'looking', 'watching', 'using', 'trying', 'doing',
  'get', 'got', 'getting', 'let', 'see', 'say', 'said', 'tell',
  'come', 'go', 'make', 'take', 'put', 'find', 'give', 'keep',
]);

function titleCase(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 10);
}

function getFrequencyMap(words: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const w of words) map.set(w, (map.get(w) || 0) + 1);
  return map;
}

export function generateRoomTitle(messages: string[]): string {
  if (messages.length === 0) return 'New Conversation';

  const allText = messages.join(' ');
  const keywords = extractKeywords(allText);

  if (keywords.length === 0) return 'General Chat';

  const freq = getFrequencyMap(keywords);
  const sorted = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w);

  const topWords = sorted.slice(0, 3);
  const title = titleCase(topWords.join(' '));

  // Cap at reasonable length
  return title.length > 40 ? title.slice(0, 40) : title;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
