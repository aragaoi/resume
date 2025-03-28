import yaml from 'js-yaml';
import { Resume } from '../../types/Resume';
import { processResumeData } from './common';

// Error type constant
const YAML_PARSE_ERROR = 'Error parsing YAML:';

/**
 * Parse YAML content into a Resume object
 */
export const parseYaml = (content: string): Resume => {
  try {
    const data = yaml.load(content);
    return processResumeData(data);
  } catch (error) {
    console.error(YAML_PARSE_ERROR, error);
    throw new Error(
      `${YAML_PARSE_ERROR} ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
