import { parseMarkdown } from '../../../lib/parsers/markdown';
import { Resume } from '../../../types/Resume';

// Mock the website parser
jest.mock('../../../lib/parsers/website', () => ({
  parseWebsiteType: jest.fn((line) => {
    if (line.toLowerCase().includes('github')) {
      return {
        url: 'https://github.com/johndoe',
        type: 'github',
        label: 'GitHub',
      };
    }
    if (line.toLowerCase().includes('linkedin')) {
      return {
        url: 'https://linkedin.com/in/johndoe',
        type: 'linkedin',
        label: 'LinkedIn',
      };
    }
    return null;
  }),
}));

describe('Markdown Parser', () => {
  test('should parse valid markdown resume', () => {
    const validMarkdown = `# John Doe
## Software Engineer

Email: john@example.com
Phone: 123-456-7890
Location: New York, NY
Website: https://github.com/johndoe
LinkedIn: https://linkedin.com/in/johndoe

# Experience
## Senior Developer
2020 - Present

Led development team at a tech company.

- Implemented CI/CD pipeline
- Reduced build times by 50%
- Mentored junior developers

# Education
## University of Technology
2015 - 2019

Bachelor of Science in Computer Science

- GPA: 3.8/4.0
- Dean's List all semesters
`;

    const result = parseMarkdown(validMarkdown);

    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.title).toBe('Software Engineer');
    expect(result.contact.email).toBe('john@example.com');
    expect(result.contact.phone).toBe('123-456-7890');
    expect(result.contact.location).toBe('New York, NY');
    expect(result.contact.websites).toBeDefined();
    expect(result.contact.websites!.length).toBe(2);

    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].title).toBe('Experience');
    expect(result.sections[0].items[0].title).toBe('Senior Developer');
    expect(result.sections[0].items[0].period?.start).toBe('2020');
    expect(result.sections[0].items[0].period?.end).toBeUndefined();
    expect(result.sections[0].items[0].description).toBe('Led development team at a tech company.');
    expect(result.sections[0].items[0].content).toHaveLength(3);

    expect(result.sections[1].title).toBe('Education');
    expect(result.sections[1].items[0].title).toBe('University of Technology');
    expect(result.sections[1].items[0].period?.start).toBe('2015');
    expect(result.sections[1].items[0].period?.end).toBe('2019');
  });

  test('should handle nested items and complex structure', () => {
    const complexMarkdown = `# John Doe

# Skills
## Programming Languages
### JavaScript
- React
- Node.js
### Python
- Django
- Flask

# Projects
## Portfolio Website
- Built with React
- Responsive design
`;

    const result = parseMarkdown(complexMarkdown);

    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.sections).toHaveLength(2);

    // Check nested items
    expect(result.sections[0].title).toBe('Skills');
    expect(result.sections[0].items[0].title).toBe('Programming Languages');
    expect(result.sections[0].items[0].items).toBeDefined();
    expect(result.sections[0].items[0].items!.length).toBe(2);
    expect(result.sections[0].items[0].items![0].title).toBe('JavaScript');
    // The parser initializes content as empty arrays
    expect(result.sections[0].items[0].items![0].content).toEqual([]);
    expect(result.sections[0].items[0].items![1].title).toBe('Python');
    expect(result.sections[0].items[0].items![1].content).toEqual([]);

    // Check projects section
    expect(result.sections[1].title).toBe('Projects');
    expect(result.sections[1].items[0].title).toBe('Portfolio Website');
    expect(result.sections[1].items[0].content).toEqual(['Built with React', 'Responsive design']);
  });
});
