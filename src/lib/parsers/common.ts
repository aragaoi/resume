import { Resume, ResumeItem, ResumeSection } from '../../types/Resume';

// Error messages
export const ERROR_MESSAGES = {
  EMPTY_DOCUMENT: 'Invalid format: Empty document',
  MISSING_NAME: 'Invalid resume format: Missing name field',
};

/**
 * Validates and transforms input data to match the Resume type
 */
export function processResumeData(data: any): Resume {
  // Essential validations
  if (!data) {
    throw new Error(ERROR_MESSAGES.EMPTY_DOCUMENT);
  }

  if (!data.name) {
    throw new Error(ERROR_MESSAGES.MISSING_NAME);
  }

  // Extract data with defaults using destructuring
  const { name, title = '', contact = {}, sections = [] } = data;

  // Process sections to match the Resume type structure
  const processedSections = Array.isArray(sections)
    ? sections.map((section) => {
        const sectionTitle = section.title || '';

        // Create section with minimal structure
        const processedSection: ResumeSection = {
          title: sectionTitle,
          items: [],
        };

        processedSection.items = section.content.map((item) => processResumeItem(item));

        return processedSection;
      })
    : [];

  return {
    name,
    title,
    contact: {
      email: contact.email || '',
      phone: contact.phone || '',
      location: contact.location || '',
      websites: Array.isArray(contact.websites) ? contact.websites : [],
    },
    sections: processedSections,
  };
}

/**
 * Process a resume item to ensure it matches the ResumeItem type
 */
function processResumeItem(item: any): ResumeItem {
  if (!item) return { title: '', content: [] };

  if (typeof item === 'string') {
    return { title: '', content: [item] };
  }

  // Extract all possible properties
  let { title = '', subtitle, period, description, content, tags, items } = item;

  // Basic sanity checks and conversions for simple fields
  title = String(title || '');
  subtitle = subtitle ? String(subtitle) : undefined;
  description = description ? String(description) : undefined;

  // Create properly structured item
  const result: ResumeItem = { title };

  // Add optional properties if they exist
  if (subtitle) result.subtitle = subtitle;
  if (description) result.description = description;

  // Process period if exists
  if (period) {
    result.period = {
      start: String(period.start || ''),
      ...(period.end && { end: String(period.end) }),
    };
  }

  // Process content - assume it's already string content
  if (content !== undefined) {
    // Just ensure it's an array
    result.content = Array.isArray(content) ? content : [content];
  }

  // Process tags if exists
  if (tags && Array.isArray(tags)) {
    result.tags = tags.map((tag) => String(tag));
  }

  // Process nested items if exists
  if (items && Array.isArray(items)) {
    result.items = items.map((subItem) => processResumeItem(subItem));
  }

  return result;
}
