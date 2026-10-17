import { describe, it, expect } from 'vitest';
import { generateRoomTitle, generateSlug } from '../src/lib/titleGenerator';

describe('generateRoomTitle', () => {
  it('returns a fallback for empty messages', () => {
    expect(generateRoomTitle([])).toBe('New Conversation');
  });

  it('extracts keywords from messages', () => {
    const title = generateRoomTitle(['I am learning Python programming language']);
    expect(typeof title).toBe('string');
    expect(title.length).toBeGreaterThan(0);
  });

  it('handles single word messages', () => {
    const title = generateRoomTitle(['Hello']);
    expect(typeof title).toBe('string');
  });

  it('handles stop-word-only messages gracefully', () => {
    const title = generateRoomTitle(['is the a to of in']);
    expect(title).toBe('General Chat');
  });

  it('caps title at 40 chars', () => {
    const longMessage = 'quantum computing algorithms artificial intelligence machine learning';
    const title = generateRoomTitle([longMessage]);
    expect(title.length).toBeLessThanOrEqual(40);
  });
});

describe('generateSlug', () => {
  it('converts name to lowercase slug', () => {
    expect(generateSlug('General Chat')).toBe('general-chat');
  });

  it('strips special characters', () => {
    expect(generateSlug('Tech & Gaming!')).toBe('tech--gaming');
  });

  it('handles spaces', () => {
    expect(generateSlug('Learning Python')).toBe('learning-python');
  });

  it('caps at 60 chars', () => {
    const longName = 'a'.repeat(100);
    expect(generateSlug(longName).length).toBeLessThanOrEqual(60);
  });
});
