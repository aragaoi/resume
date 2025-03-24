import { parsePlainText } from './parsers/plaintext';
import { parseMarkdown } from './parsers/markdown';
import { parseYaml } from './parsers/yaml';
import { parseJson } from './parsers/json';
import { Resume } from '../types/Resume';
import { ParserNormalizer } from './parsers/parser-utils';

export type FileFormat = 'json' | 'yaml' | 'md' | 'txt';

export const parseContent = (content: string, format: FileFormat): Resume => {
  let resume: Resume;

  // Parse content based on file format
  switch (format) {
    case 'json':
      resume = parseJson(content);
      break;
    case 'yaml':
      resume = parseYaml(content);
      break;
    case 'md':
      resume = parseMarkdown(content);
      break;
    case 'txt':
      resume = parsePlainText(content);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Normalize each section and its items
  resume.sections = resume.sections.map((section) => {
    section.items = section.items.map(ParserNormalizer.normalizeResumeItem);
    return section;
  });

  return resume;
};
