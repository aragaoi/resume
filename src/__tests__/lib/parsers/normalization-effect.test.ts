import { parseMarkdown } from '../../../lib/parsers/markdown';
import { normalizeResumeDates } from '../../../lib/parser';

describe('Date Normalization Effect', () => {
  test('should consistently normalize dates', () => {
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

    const parsedResume = parseMarkdown(testResume);

    // Log raw parsed dates
    console.log('Before normalization:');
    for (const section of parsedResume.sections) {
      console.log(`Section: ${section.title}`);
      for (const item of section.items) {
        console.log(`  Item: ${item.title}, Period: ${JSON.stringify(item.period)}`);
      }
    }

    // Apply normalization
    const normalizedResume = normalizeResumeDates(parsedResume);

    // Log normalized dates
    console.log('\nAfter normalization:');
    for (const section of normalizedResume.sections) {
      console.log(`Section: ${section.title}`);
      for (const item of section.items) {
        console.log(`  Item: ${item.title}, Period: ${JSON.stringify(item.period)}`);
      }
    }

    // Check that normalization has the expected effect on single dates
    const expSection = normalizedResume.sections.find((s) => s.title === 'Experience');
    const expItem = expSection?.items[0];
    expect(expItem?.period?.start).toBe('Jan 2022');
    expect(expItem?.period?.end).toBe('Jan 2022'); // Present should be normalized to match start date

    const certSection = normalizedResume.sections.find((s) => s.title === 'Certifications');

    // AWS with "- Present" should get normalized
    const awsItem = certSection?.items[0];
    expect(awsItem?.period?.start).toBe('June 2021');
    expect(awsItem?.period?.end).toBe('June 2021'); // Present should be normalized

    // GCP with single date should get normalized
    const gcpItem = certSection?.items[1];
    expect(gcpItem?.period?.start).toBe('March 2020');
    expect(gcpItem?.period?.end).toBe('March 2020'); // Should set end to equal start
  });
});
