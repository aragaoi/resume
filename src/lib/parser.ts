import { parsePlainText } from './parsers/plaintext';
import { parseMarkdown } from './parsers/markdown';
import { parseYaml } from './parsers/yaml';
import { parseJson } from './parsers/json';
import { Resume } from '../types/Resume';

export type FileFormat = 'json' | 'yaml' | 'md' | 'txt';

// Constants
const ERROR_MESSAGES = {
  UNSUPPORTED_FORMAT: (format: string) => `Unsupported format: ${format}`,
};

// Parser mapping
const PARSERS = {
  json: parseJson,
  yaml: parseYaml,
  md: parseMarkdown,
  txt: parsePlainText,
};

/**
 * Normalizes a resume by setting end date equal to start date for items with only start date
 * This ensures consistent rendering in the PDF generator
 */
export const normalizeResumeDates = (resume: Resume): Resume => {
  if (!resume.sections) return resume;

  console.log('NORMALIZING DATES - Starting normalization process');

  // Create a copy to avoid mutating the original
  const normalizedResume = { ...resume };

  normalizedResume.sections = resume.sections.map((section) => {
    // Skip sections without items
    if (!section.items || !section.items.length) return section;

    console.log(`\nProcessing section: ${section.title}`);

    return {
      ...section,
      items: section.items.map((item) => {
        console.log(`  Item: ${item.title}`);

        if (item.period) {
          console.log(`    Original period: ${JSON.stringify(item.period)}`);
        }

        // If an item has period with only a start date, set end date equal to start date
        if (item.period?.start && !item.period.end) {
          console.log(`    Setting end date equal to start date: ${item.period.start}`);
          return {
            ...item,
            period: {
              ...item.period,
              // Trim whitespace to ensure consistent comparison later
              start: item.period.start.trim(),
              end: item.period.start.trim(),
            },
          };
        }

        // Also normalize dates when both exist to ensure consistent format
        if (item.period?.start && item.period.end) {
          console.log(
            `    Normalizing both dates - start: ${item.period.start}, end: ${item.period.end}`
          );
          return {
            ...item,
            period: {
              ...item.period,
              start: item.period.start.trim(),
              end: item.period.end.trim(),
            },
          };
        }

        return item;
      }),
    };
  });

  console.log('NORMALIZING DATES - Completed normalization');
  return normalizedResume;
};

/**
 * Parse content to Resume object based on format
 */
export const parseContent = (content: string, format: FileFormat): Resume => {
  // Get the appropriate parser function
  const parser = PARSERS[format];

  if (!parser) {
    throw new Error(ERROR_MESSAGES.UNSUPPORTED_FORMAT(format));
  }

  console.log(`==== PARSING CONTENT WITH FORMAT: ${format} ====`);

  // First parse the content
  const parsed = parser(content);

  console.log('==== PARSED CONTENT BEFORE NORMALIZATION ====');
  console.log('Parsed resume sections:');
  parsed.sections.forEach((section) => {
    console.log(`\nSection: ${section.title}`);
    section.items.forEach((item) => {
      console.log(`  Item: ${item.title}`);
      if (item.period) {
        console.log(`    Period before normalization: ${JSON.stringify(item.period)}`);
      }
    });
  });

  // Then normalize
  const normalized = normalizeResumeDates(parsed);

  console.log('==== AFTER NORMALIZATION ====');
  console.log('Normalized resume sections:');
  normalized.sections.forEach((section) => {
    console.log(`\nSection: ${section.title}`);
    section.items.forEach((item) => {
      console.log(`  Item: ${item.title}`);
      if (item.period) {
        console.log(`    Period after normalization: ${JSON.stringify(item.period)}`);
        if (item.period.start === item.period.end) {
          console.log(`    MATCH: start and end dates are equal`);
        } else {
          console.log(`    NO MATCH: start and end dates different`);
        }
      }
    });
  });

  return normalized;
};
