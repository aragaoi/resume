import { Resume } from '../../types/Resume';
import { processResumeData, ERROR_MESSAGES } from './common';

// Error type constant
const JSON_PARSE_ERROR = 'Error parsing JSON:';

/**
 * Parse JSON content into a Resume object
 */
export const parseJson = (content: string): Resume => {
  try {
    const data = JSON.parse(content);
    return processResumeData(data);
  } catch (error) {
    console.error(JSON_PARSE_ERROR, error);
    throw new Error(
      `${JSON_PARSE_ERROR} ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
