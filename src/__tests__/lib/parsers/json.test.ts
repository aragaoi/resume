import { parseJson } from '../../../lib/parsers/json';
import { Resume } from '../../../types/Resume';

describe('JSON Parser', () => {
  test('should parse valid JSON resume', () => {
    const validJson = `{
      "name": "John Doe",
      "title": "Software Engineer",
      "contact": {
        "email": "john@example.com",
        "phone": "123-456-7890",
        "location": "New York, NY",
        "websites": [
          {
            "url": "https://github.com/johndoe",
            "type": "github"
          }
        ]
      },
      "sections": [
        {
          "title": "Experience",
          "items": [
            {
              "title": "Senior Developer",
              "subtitle": "Tech Company",
              "period": {
                "start": "2020-01",
                "end": "Present"
              },
              "description": "Led development team",
              "details": ["Project A", "Project B"],
              "tags": ["React", "TypeScript"]
            }
          ]
        }
      ]
    }`;

    const result = parseJson(validJson);

    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.title).toBe('Software Engineer');
    expect(result.contact.email).toBe('john@example.com');
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].title).toBe('Experience');
    expect(result.sections[0].items[0].title).toBe('Senior Developer');
  });

  test('should throw error for invalid JSON', () => {
    const invalidJson = `{
      "name": "John Doe",
      "title": "Software Engineer",
      "contact": {
        "email": "john@example.com"
      }, // Invalid comma
      "sections": []
    `;

    expect(() => parseJson(invalidJson)).toThrow();
  });
});
