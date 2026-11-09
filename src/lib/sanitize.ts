export function sanitizeMessage(input: string): string {
  if (typeof input !== 'string') return '';

  // Strip all HTML tags in browser-safe way
  const cleaned = input.replace(/<[^>]*>/g, '');

  // Normalize whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function sanitizeUsername(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
}
