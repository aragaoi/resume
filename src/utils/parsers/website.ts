import { Website } from '../../types/Resume';
import websiteTypes from '../../config/website-types.json';

export const parseWebsiteType = (line: string): Website | null => {
  const labelMatches = {
    'website:': 'personal',
    'portfolio:': 'portfolio',
    'linkedin:': 'linkedin',
  };

  const normalizedLine = line.toLowerCase();

  for (const [label, type] of Object.entries(labelMatches)) {
    if (normalizedLine.startsWith(label)) {
      const url = line.substring(label.length).trim();
      if (url && !url.includes('[') && !url.includes(']')) {
        return {
          url,
          type,
          label: websiteTypes[type]?.label || websiteTypes.other.label,
        };
      }
    }
  }

  // Fallback for markdown format
  const urlMatch = line.match(/https?:\/\/[^\s]+/);
  if (!urlMatch) return null;

  const url = urlMatch[0];
  const commentMatch = normalizedLine.match(/#\s*website:(\w+)/);
  const type = commentMatch ? commentMatch[1] : 'other';

  return {
    url,
    type,
    label: websiteTypes[type]?.label || websiteTypes.other.label,
  };
};
