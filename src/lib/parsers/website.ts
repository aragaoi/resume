import { Website } from '../../types/Resume';
import websiteTypes from '../../config/website-types.json';

// Constants for string literals
const WEBSITE_LABELS = {
  WEBSITE: 'website:',
  PORTFOLIO: 'portfolio:',
  LINKEDIN: 'linkedin:',
};

const WEBSITE_TYPES = {
  PERSONAL: 'personal',
  PORTFOLIO: 'portfolio',
  LINKEDIN: 'linkedin',
  OTHER: 'other',
};

const PLACEHOLDER_MARKERS = {
  OPEN: '[',
  CLOSE: ']',
};

// Website comment pattern for markdown
const WEBSITE_COMMENT_PATTERN = /#\s*website:(\w+)/;
const URL_PATTERN = /https?:\/\/[^\s]+/;

export const parseWebsiteType = (line: string): Website | null => {
  const labelMatches = {
    [WEBSITE_LABELS.WEBSITE]: WEBSITE_TYPES.PERSONAL,
    [WEBSITE_LABELS.PORTFOLIO]: WEBSITE_TYPES.PORTFOLIO,
    [WEBSITE_LABELS.LINKEDIN]: WEBSITE_TYPES.LINKEDIN,
  };

  const normalizedLine = line.toLowerCase();

  for (const [label, type] of Object.entries(labelMatches)) {
    if (normalizedLine.startsWith(label)) {
      const url = line.substring(label.length).trim();
      if (
        url &&
        !url.includes(PLACEHOLDER_MARKERS.OPEN) &&
        !url.includes(PLACEHOLDER_MARKERS.CLOSE)
      ) {
        return {
          url,
          type,
          label: websiteTypes[type]?.label || websiteTypes[WEBSITE_TYPES.OTHER].label,
        };
      }
    }
  }

  // Fallback for markdown format
  const urlMatch = normalizedLine.match(URL_PATTERN);
  if (!urlMatch) return null;

  const url = urlMatch[0];
  const commentMatch = normalizedLine.match(WEBSITE_COMMENT_PATTERN);
  const type = commentMatch ? commentMatch[1] : WEBSITE_TYPES.OTHER;

  return {
    url,
    type,
    label: websiteTypes[type]?.label || websiteTypes[WEBSITE_TYPES.OTHER].label,
  };
};
