import { parseWebsiteType } from '../../../lib/parsers/website';

// Mock the website types config
jest.mock(
  '../../../config/website-types.json',
  () => ({
    personal: {
      label: 'Personal Website',
      icon: '🌐',
    },
    portfolio: {
      label: 'Portfolio',
      icon: '📂',
    },
    linkedin: {
      label: 'LinkedIn',
      icon: '🔗',
    },
    github: {
      label: 'GitHub',
      icon: '💻',
    },
    other: {
      label: 'Website',
      icon: '🔗',
    },
  }),
  { virtual: true }
);

describe('Website Parser', () => {
  test('should parse website with explicit label', () => {
    const result = parseWebsiteType('Website: https://johndoe.com');

    expect(result).toBeDefined();
    expect(result?.url).toBe('https://johndoe.com');
    expect(result?.type).toBe('personal');
    expect(result?.label).toBe('Personal Website');
  });

  test('should parse portfolio website', () => {
    const result = parseWebsiteType('Portfolio: https://portfolio.johndoe.com');

    expect(result).toBeDefined();
    expect(result?.url).toBe('https://portfolio.johndoe.com');
    expect(result?.type).toBe('portfolio');
    expect(result?.label).toBe('Portfolio');
  });

  test('should parse LinkedIn profile', () => {
    const result = parseWebsiteType('LinkedIn: https://linkedin.com/in/johndoe');

    expect(result).toBeDefined();
    expect(result?.url).toBe('https://linkedin.com/in/johndoe');
    expect(result?.type).toBe('linkedin');
    expect(result?.label).toBe('LinkedIn');
  });

  test('should parse URL with type comment', () => {
    const result = parseWebsiteType('https://github.com/johndoe # website:github');

    expect(result).toBeDefined();
    expect(result?.url).toBe('https://github.com/johndoe');
    expect(result?.type).toBe('github');
    expect(result?.label).toBe('GitHub');
  });

  test('should default to other type for URL without comment', () => {
    const result = parseWebsiteType('Check out my site: https://example.com');

    expect(result).toBeDefined();
    expect(result?.url).toBe('https://example.com');
    expect(result?.type).toBe('other');
    expect(result?.label).toBe('Website');
  });

  test('should return null for text without URL', () => {
    const result = parseWebsiteType('No URL here');

    expect(result).toBeNull();
  });

  test('should handle markdown links', () => {
    const result = parseWebsiteType('Website: [My Website](https://example.com)');

    expect(result).toBeDefined();
    expect(result?.url).toBe('https://example.com)');
    expect(result?.type).toBe('other');
  });
});
