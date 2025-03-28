import { normalizeResumeDates } from '../../../lib/parser';
import { Resume } from '../../../types/Resume';

describe('Resume Date Normalization', () => {
  test('should set end date equal to start date for items with only start date', () => {
    // Mock a resume with certifications that only have start dates
    const resumeBeforeNormalization: Resume = {
      name: 'Test User',
      contact: {},
      sections: [
        {
          title: 'Certifications',
          items: [
            {
              title: 'AWS Certified Developer',
              period: { start: '2019' },
              // No end date
            },
            {
              title: 'Google Cloud Professional',
              period: { start: 'March 2022' },
              // No end date
            },
          ],
        },
        {
          title: 'Experience',
          items: [
            {
              title: 'Software Developer',
              period: { start: '2020', end: '2022' },
              // Has both start and end dates
            },
            {
              title: 'Current Role',
              period: { start: '2023' },
              // No end date (current position)
            },
          ],
        },
      ],
    };

    // Apply normalization
    const normalizedResume = normalizeResumeDates(resumeBeforeNormalization);

    // Check certifications
    const certSection = normalizedResume.sections[0];
    expect(certSection.items[0].period?.start).toBe('2019');
    expect(certSection.items[0].period?.end).toBe('2019');
    expect(certSection.items[1].period?.start).toBe('March 2022');
    expect(certSection.items[1].period?.end).toBe('March 2022');

    // Check experience
    const expSection = normalizedResume.sections[1];
    expect(expSection.items[0].period?.start).toBe('2020');
    expect(expSection.items[0].period?.end).toBe('2022'); // This should be unchanged
    expect(expSection.items[1].period?.start).toBe('2023');
    expect(expSection.items[1].period?.end).toBe('2023'); // This should be normalized
  });
});
