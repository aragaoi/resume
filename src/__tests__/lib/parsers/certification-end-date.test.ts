import { parseMarkdown } from '../../../lib/parsers/markdown';
import { normalizeResumeDates } from '../../../lib/parser';

// This test specifically checks the behavior of certification dates
// for the PDF generator rendering issue
describe('Certification End Date Handling', () => {
  const resumeWithSingleDateCertification = `# Test User

# Certifications

## AWS Certification
June 2021

- Cloud skills
`;

  test('parser should leave certification with only start date', () => {
    const resume = parseMarkdown(resumeWithSingleDateCertification);

    // Before normalization
    const certSection = resume.sections.find((s) => s.title === 'Certifications');
    expect(certSection).toBeDefined();
    expect(certSection!.items).toHaveLength(1);

    const cert = certSection!.items[0];
    expect(cert.title).toBe('AWS Certification');
    expect(cert.period).toBeDefined();
    expect(cert.period!.start).toBe('June 2021');
    expect(cert.period!.end).toBeUndefined(); // End date should be undefined initially
  });

  test('normalizeResumeDates should set end date equal to start date', () => {
    const resume = parseMarkdown(resumeWithSingleDateCertification);

    // Apply normalization
    const normalizedResume = normalizeResumeDates(resume);

    const certSection = normalizedResume.sections.find((s) => s.title === 'Certifications');
    expect(certSection).toBeDefined();

    const cert = certSection!.items[0];
    expect(cert.period).toBeDefined();
    expect(cert.period!.start).toBe('June 2021');
    expect(cert.period!.end).toBe('June 2021'); // End date should be set equal to start date

    // Explicitly verify the equality
    expect(cert.period!.start === cert.period!.end).toBe(true);

    // Log for debugging
    console.log('Certification period:', JSON.stringify(cert.period));
  });
});
