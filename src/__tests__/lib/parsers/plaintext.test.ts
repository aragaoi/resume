import { parsePlainText } from '../../../lib/parsers/plaintext';
import { Resume } from '../../../types/Resume';
import { parseWebsiteType } from '../../../lib/parsers/website';

// Tell Jest to use the mock
jest.mock('../../../lib/parsers/website');

describe('Plaintext Parser', () => {
  // Reset mock before each test
  beforeEach(() => {
    (parseWebsiteType as jest.Mock).mockClear();
  });

  test('should parse valid plaintext resume with template structure', () => {
    // Using the same structure as the template in public/templates/resume.txt
    const validPlaintext = `John Doe

Contact Information:
Email: john@example.com
Phone: 123-456-7890
Location: New York, NY
Website: https://johndoe.com
Portfolio: https://portfolio.johndoe.com
LinkedIn: https://linkedin.com/in/johndoe


EXPERIENCE

Senior Developer at Tech Company
2020 - Present

- Led development team for a major product launch
- Implemented CI/CD pipeline reducing deployment time by 50%
- Mentored junior developers and improved team productivity


Junior Developer at Startup
2018 - 2020

- Developed responsive web applications using React
- Collaborated with design team to implement UI/UX improvements
- Participated in code reviews and quality assurance


SKILLS

Technical Skills:
- JavaScript, TypeScript, React
- Node.js, Express, MongoDB
- Git, Docker, AWS

Other Skills:
- Fluent in English and Spanish
- Team leadership and mentoring
- Agile methodologies


EDUCATION

University of Technology
Bachelor of Science in Computer Science
2014 - 2018

- GPA: 3.8/4.0
- Dean's List all semesters
- Relevant courses: Data Structures, Algorithms, Web Development


CERTIFICATIONS

AWS Certified Developer
Amazon Web Services
2019

- Cloud architecture and deployment
- Achieved score in the top 10%
`;

    const result = parsePlainText(validPlaintext);

    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.contact.email).toBe('john@example.com');
    expect(result.contact.phone).toBe('123-456-7890');
    expect(result.contact.location).toBe('New York, NY');

    // Check websites
    expect(result.contact.websites).toBeDefined();

    // Check sections
    expect(result.sections).toHaveLength(4);

    // Experience section
    const experienceSection = result.sections.find((s) => s.title === 'EXPERIENCE');
    expect(experienceSection).toBeDefined();
    expect(experienceSection!.items).toHaveLength(2);
    expect(experienceSection!.items[0].title).toBe('Senior Developer at Tech Company');

    // Skills section
    const skillsSection = result.sections.find((s) => s.title === 'SKILLS');
    expect(skillsSection).toBeDefined();
    expect(skillsSection!.items).toHaveLength(2);
    expect(skillsSection!.items[0].title).toBe('Technical Skills:');

    // Education section
    const educationSection = result.sections.find((s) => s.title === 'EDUCATION');
    expect(educationSection).toBeDefined();
    expect(educationSection!.items).toHaveLength(1);
    expect(educationSection!.items[0].title).toBe('University of Technology');

    // Certifications section
    const certificationsSection = result.sections.find((s) => s.title === 'CERTIFICATIONS');
    expect(certificationsSection).toBeDefined();
    expect(certificationsSection!.items).toHaveLength(1);
    expect(certificationsSection!.items[0].title).toBe('AWS Certified Developer');
  });

  test('should handle empty sections and missing fields', () => {
    const minimalPlaintext = `John Doe

EXPERIENCE

EDUCATION
`;

    const result = parsePlainText(minimalPlaintext);

    expect(result).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.title).toBe('');
    expect(result.contact.email).toBe('');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].title).toBe('EXPERIENCE');
    expect(result.sections[0].items).toHaveLength(0);
    expect(result.sections[1].title).toBe('EDUCATION');
    expect(result.sections[1].items).toHaveLength(0);
  });
});
