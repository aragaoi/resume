import { Resume, ResumeSection, ResumeItem, Period, Website } from '../../types/Resume';
import { parseWebsiteType } from './website';

// Constants for string literals
const CONTACT_SECTION_HEADER = 'contact information:';
const CONTACT_FIELDS = {
  EMAIL: 'email',
  PHONE: 'phone',
  LOCATION: 'location',
  WEBSITE: 'website',
  PORTFOLIO: 'portfolio',
  LINKEDIN: 'linkedin',
};

const SUMMARY_FIELD_PREFIX = 'summary:';
const BULLET_POINT = '-';
const COLON = ':';
const PLACEHOLDER_MARKERS = {
  OPEN: '[',
  CLOSE: ']',
};

const parsePeriod = (text: string): Period | undefined => {
  // Support for multiple date formats:
  // - Full month name + year (January 2020)
  // - Month abbreviation + year (Jan 2020)
  // - MM/YYYY (01/2020)
  // - MM-YYYY (01-2020)
  // - MM/YY (01/20)
  // - MM-YY (01-20)
  // - YYYY/MM (2020/01)
  // - YYYY-MM (2020-01)
  // - YYYY (2020)
  const periodMatch = text.match(
    /((?:[a-zA-Z]{3,}\.?|[a-zA-Z]{3})[\s.]?\d{4}|(?:\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}|\d{1,2}[\/]\d{2}|\d{4}))\s*[-–]\s*(.+)/
  );
  if (periodMatch) {
    const endText = periodMatch[2].trim();
    return {
      start: periodMatch[1].trim(),
      end: endText === 'Present' ? undefined : endText,
    };
  }
  return undefined;
};

// Check if a line is likely a date-related line
const isDateLine = (line: string): boolean => {
  const trimmedLine = line.trim();

  // Check for common date patterns
  const containsYear = /\b\d{4}\b/.test(trimmedLine); // Has a 4-digit year
  const containsYearShort = /\b\d{2}\b/.test(trimmedLine) && /[\/\-]/.test(trimmedLine); // Has a 2-digit year with slash or dash

  // Match month names or abbreviations
  const monthRegex =
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\b/i;
  const containsMonthName = monthRegex.test(trimmedLine);

  // Match date formats like MM/YY, MM-YY, etc.
  const containsFormattedDate =
    /\b\d{1,2}[-\/]\d{2,4}\b/.test(trimmedLine) || /\b\d{4}[-\/]\d{1,2}\b/.test(trimmedLine);

  // Match range indicators
  const containsDateRange = /\s[-–]\s/.test(trimmedLine);

  // Check for various date patterns
  if (
    (containsMonthName && (containsYear || containsYearShort)) ||
    containsFormattedDate ||
    ((containsYear || containsYearShort) && (trimmedLine.length < 20 || containsDateRange))
  ) {
    return true;
  }

  // Fallback to the old number-based heuristic
  const numbers = trimmedLine.replace(/[^0-9]/g, '').length;
  const letters = trimmedLine.replace(/[^a-zA-Z]/g, '').length;

  // If it has more numbers than letters, it's likely a date line
  return numbers > letters;
};

// Check if a line is a main section header based on structure, not specific names
const isMainSectionHeader = (line: string): boolean => {
  // Main sections are typically standalone, all caps, and not too long
  return (
    line === line.toUpperCase() &&
    line.trim().length > 0 &&
    !line.includes(COLON) &&
    !line.startsWith(BULLET_POINT) &&
    // Avoid treating date lines as section headers
    !isDateLine(line)
  );
};

// Check if a line is a subsection header based on structure
const isSubsectionHeader = (line: string): boolean => {
  // Contact field prefixes to exclude
  const contactFields = [
    CONTACT_FIELDS.EMAIL,
    CONTACT_FIELDS.PHONE,
    CONTACT_FIELDS.LOCATION,
    CONTACT_FIELDS.WEBSITE,
    CONTACT_FIELDS.PORTFOLIO,
    CONTACT_FIELDS.LINKEDIN,
  ];
  return (
    line.endsWith(COLON) &&
    !contactFields.some((field) => line.toLowerCase().startsWith(field + COLON))
  );
};

// Helper function to create and process an item from the current state
const createItemFromLines = (
  title: string,
  period: Period | undefined,
  lines: string[]
): ResumeItem | null => {
  const item: ResumeItem = {
    title,
    period,
    content: [],
  };

  // Process bullet points as content
  for (const line of lines) {
    if (line.startsWith(BULLET_POINT)) {
      item.content!.push(line.substring(1).trim());
    }
  }

  // Return the item if it has content or a title
  if (item.title || (item.content && item.content.length > 0)) {
    return item;
  }
  return null;
};

export function parsePlainText(content: string): Resume {
  const lines = content.split('\n');
  const sections: ResumeSection[] = [];
  let name = '';
  let title = '';
  let email = '';
  let phone = '';
  let location = '';
  const websites: Website[] = [];
  let summaryContent: string[] = [];

  let isContactSection = false;

  // Pre-processing: Extract sections and their blocks for better handling
  const sectionBlocks: { title: string; content: string[] }[] = [];
  let currentSectionTitle = '';
  let currentBlock: string[] = [];

  // First pass to identify section blocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for summary field
    if (line.toLowerCase().startsWith(SUMMARY_FIELD_PREFIX)) {
      // Extract summary content from this line
      const summaryLine = line.substring(SUMMARY_FIELD_PREFIX.length).trim();
      if (summaryLine) {
        summaryContent.push(summaryLine);
      }

      // Collect any subsequent lines until we hit an empty line or a section header
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (
          !nextLine ||
          isMainSectionHeader(nextLine) ||
          nextLine.toLowerCase().startsWith(SUMMARY_FIELD_PREFIX)
        ) {
          break;
        }
        summaryContent.push(nextLine);
        j++;
      }

      // Skip the lines we've processed
      i = j - 1;
      continue;
    }

    // Skip the first two blocks (name and contact info)
    if (!currentSectionTitle && isMainSectionHeader(line)) {
      currentSectionTitle = line;
      currentBlock = [];
    } else if (currentSectionTitle && isMainSectionHeader(line)) {
      // We found a new section
      sectionBlocks.push({
        title: currentSectionTitle,
        content: [...currentBlock],
      });
      currentSectionTitle = line;
      currentBlock = [];
    } else if (currentSectionTitle) {
      currentBlock.push(line);
    }
  }

  // Add the last section
  if (currentSectionTitle && currentBlock.length > 0) {
    sectionBlocks.push({
      title: currentSectionTitle,
      content: [...currentBlock],
    });
  }

  // Basic parsing for name and contact info
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // First non-empty line is the name
    if (!name) {
      name = line;

      // Check if the next line might be a title/headline
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (
          nextLine &&
          !nextLine.toLowerCase().includes(CONTACT_SECTION_HEADER) &&
          !isMainSectionHeader(nextLine) &&
          !nextLine.includes(COLON)
        ) {
          title = nextLine;
          i++; // Skip the next line since we've processed it
        }
      }
      continue;
    }

    // Contact section
    if (line.toLowerCase() === CONTACT_SECTION_HEADER) {
      isContactSection = true;
      continue;
    }

    if (isContactSection) {
      const normalizedLine = line.toLowerCase();
      if (normalizedLine.startsWith(CONTACT_FIELDS.EMAIL + COLON)) {
        email = line.split(COLON)[1].trim();
      } else if (normalizedLine.startsWith(CONTACT_FIELDS.PHONE + COLON)) {
        phone = line.split(COLON)[1].trim();
      } else if (normalizedLine.startsWith(CONTACT_FIELDS.LOCATION + COLON)) {
        location = line.split(COLON)[1].trim();
      } else if (
        normalizedLine.startsWith(CONTACT_FIELDS.WEBSITE + COLON) ||
        normalizedLine.startsWith(CONTACT_FIELDS.PORTFOLIO + COLON) ||
        normalizedLine.startsWith(CONTACT_FIELDS.LINKEDIN + COLON)
      ) {
        const website = parseWebsiteType(line);
        if (website) {
          websites.push(website);
        }
      } else if (
        line.trim() &&
        !line.includes(PLACEHOLDER_MARKERS.OPEN) &&
        !line.includes(PLACEHOLDER_MARKERS.CLOSE) &&
        isMainSectionHeader(line)
      ) {
        // Only break out of contact section if we hit a main section header
        isContactSection = false;
        // We need to reprocess this line since it's a section header
        i--;
      }
    }
  }

  // If we found a summary, create a dedicated summary section
  if (summaryContent.length > 0) {
    sections.push({
      title: 'SUMMARY',
      items: [
        {
          title: '',
          content: summaryContent,
        },
      ],
    });
  }

  // Process each section block
  for (const sectionBlock of sectionBlocks) {
    const sectionItems: ResumeItem[] = [];
    let itemLines: string[] = [];
    let currentItemTitle = '';
    let currentItemPeriod: Period | undefined = undefined;

    const section: ResumeSection = {
      title: sectionBlock.title,
      items: [],
    };

    const addCurrentItem = () => {
      if (currentItemTitle || itemLines.length > 0) {
        const item = createItemFromLines(currentItemTitle, currentItemPeriod, itemLines);
        if (item) sectionItems.push(item);

        // Reset for next item
        currentItemTitle = '';
        currentItemPeriod = undefined;
        itemLines = [];
      }
    };

    // Process the section content to identify items
    for (let i = 0; i < sectionBlock.content.length; i++) {
      const line = sectionBlock.content[i].trim();

      // Empty line indicates end of an item
      if (!line) {
        addCurrentItem();
        continue;
      }

      // Check for subsection headers (like "Technical Skills:")
      if (isSubsectionHeader(line)) {
        addCurrentItem();

        // Create a new subsection item
        currentItemTitle = line;
        currentItemPeriod = undefined;
        continue;
      }

      // Check if this is a bullet point (part of current item)
      if (line.startsWith(BULLET_POINT)) {
        itemLines.push(line);
        continue;
      }

      // If this is a date line and we have a title, it's likely the period for the current item
      if (isDateLine(line) && currentItemTitle) {
        const period = parsePeriod(line);
        if (period) {
          currentItemPeriod = period;
        } else {
          currentItemPeriod = { start: line };
        }
        continue;
      }

      // If we have no title yet, this is likely a title
      if (!currentItemTitle) {
        // Check if next line is a date
        const nextLineIndex = i + 1 < sectionBlock.content.length ? i + 1 : -1;
        if (nextLineIndex >= 0) {
          const nextLine = sectionBlock.content[nextLineIndex].trim();
          if (isDateLine(nextLine)) {
            // This is a title followed by a date
            currentItemTitle = line;
            const period = parsePeriod(nextLine);
            if (period) {
              currentItemPeriod = period;
            } else {
              currentItemPeriod = { start: nextLine };
            }
            i++; // Skip the next line (date)
            continue;
          }
        }

        // If no date on next line, treat as title anyway
        currentItemTitle = line;
        continue;
      }

      // If it's not a bullet and we have a title, add to item lines for later processing
      itemLines.push(line);
    }

    // Add the last item if we have one
    addCurrentItem();

    // Post-process section items to merge related items
    const mergedItems: ResumeItem[] = [];

    // Merge title items with their bullet points
    for (let i = 0; i < sectionItems.length; i++) {
      const currentItem = sectionItems[i];
      const nextItem = i + 1 < sectionItems.length ? sectionItems[i + 1] : null;

      // If this item has a title and the next item doesn't but has content, merge them
      if (
        currentItem.title &&
        nextItem &&
        !nextItem.title &&
        nextItem.content &&
        nextItem.content.length > 0
      ) {
        // Ensure we have a valid content array
        const currentContent = currentItem.content || [];

        const mergedItem: ResumeItem = {
          title: currentItem.title,
          period: currentItem.period || nextItem.period,
          content: [...currentContent],
        };

        // Add next item's content
        if (nextItem.content) {
          mergedItem.content!.push(...nextItem.content);
        }

        mergedItems.push(mergedItem);
        i++; // Skip the next item since we've merged it
      } else {
        mergedItems.push(currentItem);
      }
    }

    section.items = mergedItems;
    sections.push(section);
  }

  return {
    name,
    title,
    contact: {
      email,
      phone,
      location,
      websites,
    },
    sections: sections,
  };
}
