import { parseMarkdown } from '../../../lib/parsers/markdown';

describe('Markdown Parser Date Handling', () => {
  test('should handle "- Present" consistently', () => {
    const testResume = `# Test User

# Experience

## Senior Position
Jan 2022 - Present

- Job tasks

# Certifications

## AWS Certified Developer
June 2021 - Present

- AWS skills

## Google Cloud Certification
March 2020

- GCP skills
`;

    const resume = parseMarkdown(testResume);

    // Check Experience period with "Present"
    const experienceSection = resume.sections.find((s) => s.title === 'Experience');
    expect(experienceSection).toBeDefined();
    const expPeriod = experienceSection?.items[0].period;
    console.log('Experience Period:', JSON.stringify(expPeriod));
    expect(expPeriod?.start).toBe('Jan 2022');
    expect(expPeriod?.end).toBeUndefined(); // "Present" should be undefined

    // Check Certification periods
    const certSection = resume.sections.find((s) => s.title === 'Certifications');
    expect(certSection).toBeDefined();

    // AWS with "- Present"
    const awsPeriod = certSection?.items[0].period;
    console.log('AWS Period:', JSON.stringify(awsPeriod));
    expect(awsPeriod?.start).toBe('June 2021');
    expect(awsPeriod?.end).toBeUndefined(); // "Present" should be undefined

    // GCP with single date
    const gcpPeriod = certSection?.items[1].period;
    console.log('GCP Period:', JSON.stringify(gcpPeriod));
    expect(gcpPeriod?.start).toBe('March 2020');
    expect(gcpPeriod?.end).toBeUndefined(); // Single date should have undefined end
  });
});
