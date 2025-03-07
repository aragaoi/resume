import { Resume } from '../../types/Resume';

export const parseJson = (content: string): Resume => {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw error;
  }
};
