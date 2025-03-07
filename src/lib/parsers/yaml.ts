import yaml from 'js-yaml';
import { Resume } from '../../types/Resume';

export const parseYaml = (content: string): Resume => {
  try {
    return yaml.load(content) as Resume;
  } catch (error) {
    console.error('Error parsing YAML:', error);
    throw error;
  }
};
