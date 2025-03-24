import { Resume, ResumeItem, ResumeSection } from '../../types/Resume';

/**
 * Processes an item to ensure it matches the expected Resume data structure
 */
function processItem(item: any): ResumeItem {
  // Convert legacy date to period
  if (item.date && !item.period) {
    item.period = { start: item.date };
    delete item.date;
  }

  // Handle both legacy content and details fields
  // Move details to content if needed
  if (item.details && item.details.length > 0) {
    item.content = item.content || [];
    for (const detail of item.details) {
      if (!item.content.includes(detail)) {
        item.content.push(detail);
      }
    }
    delete item.details;
  }

  // Process nested items if any
  if (item.items && item.items.length > 0) {
    item.items = item.items.map(processItem);
  }

  return item;
}

/**
 * Processes a section to ensure it matches the expected Resume data structure
 */
function processSection(section: any): ResumeSection {
  return {
    title: section.title,
    items: section.items.map(processItem),
  };
}

export const parseJson = (content: string): Resume => {
  try {
    const data = JSON.parse(content);

    // Process all sections to ensure they match the expected format
    if (data.sections && Array.isArray(data.sections)) {
      data.sections = data.sections.map(processSection);
    }

    return data;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw error;
  }
};
