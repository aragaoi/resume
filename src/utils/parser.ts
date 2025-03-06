import yaml from 'js-yaml';
import { Resume } from '../types/Resume';
import { parseMarkdownContent } from './parsers/markdown';
import { parsePlainText } from './parsers/plaintext';

export const parseResumeFile = async (content: string, fileType: string): Promise<Resume> => {
  try {
    switch (fileType.toLowerCase()) {
      case 'json':
        return JSON.parse(content);
      case 'yml':
      case 'yaml':
        return yaml.load(content) as Resume;
      case 'txt':
        return parsePlainText(content);
      case 'md':
        return parseMarkdownContent(content);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error parsing resume file:', error);
    throw error;
  }
};
