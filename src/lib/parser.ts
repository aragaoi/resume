import { parsePlainText } from './parsers/plaintext';
import { parseMarkdown } from './parsers/markdown';
import { parseYaml } from './parsers/yaml';
import { parseJson } from './parsers/json';
import { Resume } from '../types/Resume';

export type FileFormat = 'json' | 'yaml' | 'md' | 'txt';

/**
 * Normalizes a resume by setting end date equal to start date for items with only start date
 * This ensures consistent rendering in the PDF generator
 */
export const normalizeResumeDates = (resume: Resume): Resume => {
  if (!resume.sections) return resume;

  resume.sections.forEach((section) => {
    if (!section.items) return;

    section.items.forEach((item) => {
      // If an item has period with only a start date, set end date equal to start date
      if (item.period && item.period.start && !item.period.end) {
        item.period.end = item.period.start;
      }
    });
  });

  return resume;
};

export const parseContent = (content: string, format: FileFormat): Resume => {
  let parsedResume: Resume;

  // Parse based on format
  switch (format) {
    case 'json':
      parsedResume = parseJson(content);
      break;
    case 'yaml':
      parsedResume = parseYaml(content);
      break;
    case 'md':
      parsedResume = parseMarkdown(content);
      break;
    case 'txt':
      parsedResume = parsePlainText(content);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Normalize dates before returning
  return normalizeResumeDates(parsedResume);
};
