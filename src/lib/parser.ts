import { parsePlainText } from './parsers/plaintext';
import { parseMarkdown } from './parsers/markdown';
import { parseYaml } from './parsers/yaml';
import { parseJson } from './parsers/json';
import { Resume } from '../types/Resume';

export type FileFormat = 'json' | 'yaml' | 'md' | 'txt';

export const parseContent = (content: string, format: FileFormat): Resume => {
  switch (format) {
    case 'json':
      return parseJson(content);
    case 'yaml':
      return parseYaml(content);
    case 'md':
      return parseMarkdown(content);
    case 'txt':
      return parsePlainText(content);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};
