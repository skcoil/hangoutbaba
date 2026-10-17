import sanitizeHtml from 'sanitize-html';

export function sanitizeMessage(input: string): string {
  if (typeof input !== 'string') return '';

  // Strip all HTML
  const cleaned = sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });

  // Normalize whitespace
  return cleaned.replace(/\s+/g, ' ').trim();
}

export function sanitizeUsername(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^A-Za-z0-9]/g, '').slice(0, 30);
}
