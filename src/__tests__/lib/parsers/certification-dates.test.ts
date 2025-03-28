import { parseMarkdown } from '../../../lib/parsers/markdown';
import { Resume } from '../../../types/Resume';

// Mock the website parser
jest.mock('../../../lib/parsers/website', () => ({
  parseWebsiteType: jest.fn(() => null),
}));

describe('Certification Date Handling', () => {
  test('should parse certification dates consistently with other dates', () => {
    const resumeWithCertifications = `# John Doe
## Software Engineer

# Experience
## Senior Developer
Jan 2020 - Present

Led development team.

# Certifications
## AWS Certified Developer
2019

Achieved certification with high marks.

## Azure DevOps Expert
May 2021 - May 2023

Renewed certification.

## Google Cloud Professional
March 2022

Advanced cloud computing certification.
`;

    const result = parseMarkdown(resumeWithCertifications);

    // Experience section date check
    const experienceSection = result.sections.find((s) => s.title === 'Experience');
    expect(experienceSection).toBeDefined();
    expect(experienceSection!.items[0].period).toBeDefined();
    expect(experienceSection!.items[0].period!.start).toBe('Jan 2020');
    expect(experienceSection!.items[0].period!.end).toBeUndefined(); // Present = undefined

    // Certifications section date check
    const certSection = result.sections.find((s) => s.title === 'Certifications');
    expect(certSection).toBeDefined();
    expect(certSection!.items).toHaveLength(3);

    // Single year certification
    expect(certSection!.items[0].title).toBe('AWS Certified Developer');
    expect(certSection!.items[0].period).toBeDefined();
    expect(certSection!.items[0].period!.start).toBe('2019');

    // Date range certification
    expect(certSection!.items[1].title).toBe('Azure DevOps Expert');
    expect(certSection!.items[1].period).toBeDefined();
    expect(certSection!.items[1].period!.start).toBe('May 2021');
    expect(certSection!.items[1].period!.end).toBe('May 2023');

    // Month and year certification
    expect(certSection!.items[2].title).toBe('Google Cloud Professional');
    expect(certSection!.items[2].period).toBeDefined();
    expect(certSection!.items[2].period!.start).toBe('March 2022');
  });

  test('should handle various certification date formats', () => {
    const resumeWithVariousDates = `# John Doe

# Certifications
## Certification 1
03/2021

## Certification 2
2020

## Certification 3
January 2019

## Certification 4
Jan. 2018

## Certification 5
1/2022

## Certification 6
2023-04

## Certification 7
Issued: 05/2023
`;

    const result = parseMarkdown(resumeWithVariousDates);
    const certSection = result.sections[0];

    expect(certSection.items[0].period!.start).toBe('03/2021');
    expect(certSection.items[1].period!.start).toBe('2020');
    expect(certSection.items[2].period!.start).toBe('January 2019');
    expect(certSection.items[3].period!.start).toBe('Jan. 2018');
    expect(certSection.items[4].period!.start).toBe('1/2022');
    expect(certSection.items[5].period!.start).toBe('2023-04');
    expect(certSection.items[6].period!.start).toBe('05/2023');
  });
});
