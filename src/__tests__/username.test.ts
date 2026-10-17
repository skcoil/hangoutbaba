import { describe, it, expect } from 'vitest';
import { generateUsername, isValidUsername } from '../src/lib/username';

describe('generateUsername', () => {
  it('generates a string', () => {
    const username = generateUsername();
    expect(typeof username).toBe('string');
  });

  it('follows AdjAnimalNN pattern', () => {
    const username = generateUsername();
    // Should be 3-30 alphanumeric chars
    expect(username).toMatch(/^[A-Za-z0-9]{5,32}$/);
  });

  it('generates different usernames (randomness)', () => {
    const names = new Set(Array.from({ length: 20 }, generateUsername));
    // Should have at least 10 unique names out of 20
    expect(names.size).toBeGreaterThan(10);
  });
});

describe('isValidUsername', () => {
  it('accepts valid usernames', () => {
    expect(isValidUsername('BlueFox42')).toBe(true);
    expect(isValidUsername('abc')).toBe(true);
    expect(isValidUsername('ABCDEFGHIJ1234567890123456789')).toBe(true);
  });

  it('rejects too short usernames', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('')).toBe(false);
  });

  it('rejects too long usernames', () => {
    expect(isValidUsername('a'.repeat(31))).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isValidUsername('blue fox')).toBe(false);
    expect(isValidUsername('user@name')).toBe(false);
    expect(isValidUsername('user-name')).toBe(false);
  });
});
