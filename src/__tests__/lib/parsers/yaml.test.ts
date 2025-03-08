import { parseYaml } from '../../../lib/parsers/yaml';
import { Resume } from '../../../types/Resume';

describe('YAML Parser', () => {
  test('should parse valid YAML resume', () => {
    const validYaml = `
name: John Doe
title: Software Engineer
contact:
  email: john@example.com
  phone: 123-456-7890
  location: New York, NY
  websites:
    - url: https://github.com/johndoe
      type: github
sections:
  - title: Experience
    items:
      - title: Senior Developer
        subtitle: Tech Company
        period:
          start: 2020-01
          end: Present
        description: Led development team
        details:
          - Project A
          - Project B
        tags:
          - React
          - TypeScript
    `;

    const result = parseYaml(validYaml);

    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.title).toBe('Software Engineer');
    expect(result.contact.email).toBe('john@example.com');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBe('Experience');
    expect(result.sections[0].items[0].title).toBe('Senior Developer');
  });

  test('should throw error for invalid YAML', () => {
    const invalidYaml = `
name: John Doe
title: Software Engineer
contact:
  email: john@example.com
  phone: 123-456-7890
  location: New York, NY
  websites:
    - url: https://github.com/johndoe
      type: github
sections:
  - title: Experience
    items:
      - title: Senior Developer
        subtitle: Tech Company
        period:
          start: 2020-01
          end: Present
        description: Led development team
        details:
          - Project A
          - Project B
        tags:
          - React
          - TypeScript
      indentation: error
    `;

    expect(() => parseYaml(invalidYaml)).toThrow();
  });
});
