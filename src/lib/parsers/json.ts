import { Resume, ResumeItem, ResumeSection } from '../../types/Resume';

/**
 * Processes an item to ensure it matches the expected Resume data structure
 */
function processItem(item: any): ResumeItem {
  // If item is null or undefined, return a minimal valid item
  if (!item) {
    return { title: '', content: [] };
  }

  // If item is a string, wrap it as an item with content
  if (typeof item === 'string') {
    return { title: '', content: [item] };
  }

  // Convert legacy date to period
  if (item.date && !item.period) {
    item.period = { start: item.date };
    delete item.date;
  }

  // Handle both legacy content and details fields
  // Move details to content if needed
  if (item.details && Array.isArray(item.details) && item.details.length > 0) {
    if (!item.content) {
      item.content = [];
    } else if (!Array.isArray(item.content)) {
      item.content = [String(item.content)];
    }

    for (const detail of item.details) {
      if (detail && !item.content.includes(detail)) {
        item.content.push(detail);
      }
    }
    delete item.details;
  }

  // Ensure content is always an array
  if (!item.content) {
    item.content = [];
  } else if (!Array.isArray(item.content)) {
    item.content = [String(item.content)];
  }

  // Process nested items if any
  if (item.items && Array.isArray(item.items) && item.items.length > 0) {
    item.items = item.items.map(processItem);
  }

  return item;
}

/**
 * Processes a section to ensure it matches the expected Resume data structure
 */
function processSection(section: any): ResumeSection {
  // Check if section has content instead of items (new format)
  if (section.content) {
    // Convert section content to the expected format if needed
    const processedItems = Array.isArray(section.content)
      ? section.content.map((item) =>
          typeof item === 'string' ? { content: [item] } : processItem(item)
        )
      : [];

    // If all items have no title and each has only text content (not structured data),
    // this is likely a paragraph-style section, so combine them into a single item
    const isParagraphStyleSection =
      processedItems.length > 0 &&
      processedItems.every(
        (item) =>
          !item.title &&
          item.content &&
          item.content.length > 0 &&
          !item.period &&
          !item.subtitle &&
          !item.tags
      );

    if (isParagraphStyleSection) {
      // Collect all content from all items
      const allContent: string[] = [];
      processedItems.forEach((item) => {
        if (item.content && item.content.length > 0) {
          allContent.push(...item.content);
        }
      });

      // Create a single item with all content joined together
      if (allContent.length > 0) {
        return {
          title: section.title,
          items: [
            {
              title: '',
              content: [allContent.join('\n\n')],
            },
          ],
        };
      }
    }

    return {
      title: section.title || '',
      items: processedItems,
    };
  }

  // Support legacy format where items is used instead of content
  const processedItems =
    section.items && Array.isArray(section.items) ? section.items.map(processItem) : [];

  // If all items have no title and each has only text content (not structured data),
  // this is likely a paragraph-style section, so combine them into a single item
  const isParagraphStyleSection =
    processedItems.length > 0 &&
    processedItems.every(
      (item) =>
        !item.title &&
        item.content &&
        item.content.length > 0 &&
        !item.period &&
        !item.subtitle &&
        !item.tags
    );

  if (isParagraphStyleSection) {
    // Collect all content from all items
    const allContent: string[] = [];
    processedItems.forEach((item) => {
      if (item.content && item.content.length > 0) {
        allContent.push(...item.content);
      }
    });

    // Create a single item with all content joined together
    if (allContent.length > 0) {
      return {
        title: section.title,
        items: [
          {
            title: '',
            content: [allContent.join('\n\n')],
          },
        ],
      };
    }
  }

  return {
    title: section.title || '',
    items: processedItems,
  };
}

export const parseJson = (content: string): Resume => {
  try {
    const data = JSON.parse(content);

    // Ensure we have the minimum required structure
    if (!data) {
      throw new Error('Invalid JSON format: Empty document');
    }

    if (!data.name) {
      throw new Error('Invalid resume format: Missing name field');
    }

    if (!data.contact) {
      data.contact = {};
    }

    // Process all sections to ensure they match the expected format
    if (!data.sections) {
      data.sections = [];
    } else if (Array.isArray(data.sections)) {
      data.sections = data.sections.map(processSection);
    } else {
      console.warn('Resume sections is not an array, replacing with empty array');
      data.sections = [];
    }

    return data;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error(
      `Error parsing JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
