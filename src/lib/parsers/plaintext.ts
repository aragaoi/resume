import { Resume, ResumeSection, ResumeItem, Period, Website } from '../../types/Resume';
import { parseWebsiteType } from './website';

const parsePeriod = (text: string): Period | undefined => {
  // Look for patterns like "January 2020 - Present" or "2015 - 2019"
  const periodMatch = text.match(/(\d{4}(?:[-\/]\d{2})?)\s+-\s+(.+)/);
  if (periodMatch) {
    return {
      start: periodMatch[1].trim(),
      end: periodMatch[2].trim() === 'Present' ? undefined : periodMatch[2].trim(),
    };
  }
  return undefined;
};

// Check if a line is likely a date-related line
const isDateLine = (line: string): boolean => {
  // Count numbers and letters in the line
  const trimmedLine = line.trim();
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
    !line.includes(':') &&
    !line.startsWith('-') &&
    // Avoid treating date lines as section headers
    !isDateLine(line)
  );
};

// Check if a line is a subsection header based on structure
const isSubsectionHeader = (line: string): boolean => {
  return (
    line.endsWith(':') &&
    !line.toLowerCase().startsWith('email:') &&
    !line.toLowerCase().startsWith('phone:') &&
    !line.toLowerCase().startsWith('location:') &&
    !line.toLowerCase().startsWith('website:') &&
    !line.toLowerCase().startsWith('portfolio:') &&
    !line.toLowerCase().startsWith('linkedin:')
  );
};

export function parsePlainText(content: string): Resume {
  const lines = content.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let currentSubsection: ResumeItem | null = null;
  let currentItem: ResumeItem | null = null;
  let name = '';
  let title = '';
  let email = '';
  let phone = '';
  let location = '';
  const websites: Website[] = [];

  let isContactSection = false;
  const sectionMap = new Map<string, ResumeSection>(); // Track sections by title

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Empty lines can indicate the end of an item
      if (currentItem && currentSection && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // If the next non-empty line is not a bullet point and not a section header,
        // it's likely a new item title
        if (
          nextLine &&
          !nextLine.startsWith('-') &&
          !isMainSectionHeader(nextLine) &&
          !isDateLine(nextLine)
        ) {
          if (currentSubsection) {
            if (!currentSubsection.items) currentSubsection.items = [];
            currentSubsection.items.push(currentItem);
          } else {
            currentSection.items.push(currentItem);
          }
          currentItem = null;
        }
      }
      continue;
    }

    // First non-empty line is the name
    if (!name) {
      name = line;

      // Check if the next line might be a title/headline
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (
          nextLine &&
          !nextLine.toLowerCase().includes('contact information') &&
          !isMainSectionHeader(nextLine) &&
          !nextLine.includes(':')
        ) {
          title = nextLine;
          i++; // Skip the next line since we've processed it
        }
      }
      continue;
    }

    // Contact section
    if (line.toLowerCase() === 'contact information:') {
      isContactSection = true;
      continue;
    }

    if (isContactSection) {
      const normalizedLine = line.toLowerCase();
      if (normalizedLine.startsWith('email:')) {
        email = line.split(':')[1].trim();
      } else if (normalizedLine.startsWith('phone:')) {
        phone = line.split(':')[1].trim();
      } else if (normalizedLine.startsWith('location:')) {
        location = line.split(':')[1].trim();
      } else if (
        normalizedLine.startsWith('website:') ||
        normalizedLine.startsWith('portfolio:') ||
        normalizedLine.startsWith('linkedin:')
      ) {
        const website = parseWebsiteType(line);
        if (website) {
          websites.push(website);
        }
      } else if (line.trim() && !line.includes('[') && !line.includes(']')) {
        // If we hit a non-empty line that's not a placeholder and not a website,
        // we're out of the contact section
        isContactSection = false;
        i--; // Re-process this line
      }

      if (isContactSection) continue;
    }

    // Main section headers
    if (isMainSectionHeader(line)) {
      // Save current items before moving to a new section
      if (currentItem && currentSubsection) {
        if (!currentSubsection.items) currentSubsection.items = [];
        currentSubsection.items.push(currentItem);
        currentItem = null;
      } else if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
        currentItem = null;
      }

      if (currentSubsection && currentSection) {
        currentSection.items.push(currentSubsection);
        currentSubsection = null;
      }

      // Check if we've already seen this section
      if (sectionMap.has(line)) {
        currentSection = sectionMap.get(line)!;
      } else {
        currentSection = {
          title: line,
          items: [],
        };
        sections.push(currentSection);
        sectionMap.set(line, currentSection);
      }

      currentSubsection = null;
      currentItem = null;
      continue;
    }

    // Subsection headers (like "Technical Skills:")
    if (currentSection && isSubsectionHeader(line)) {
      if (currentItem && currentSubsection) {
        if (!currentSubsection.items) currentSubsection.items = [];
        currentSubsection.items.push(currentItem);
        currentItem = null;
      } else if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
        currentItem = null;
      }

      if (currentSubsection) {
        currentSection.items.push(currentSubsection);
      }

      currentSubsection = {
        title: line, // Keep the colon in the title
        items: [],
      };
      currentItem = null;
      continue;
    }

    // Job/Education entries with periods
    if (currentSection && !line.startsWith('-')) {
      // Check if the next line might be a subtitle (organization, degree, etc.)
      let subtitleLine = '';
      let periodLine = '';

      if (i + 1 < lines.length && !lines[i + 1].startsWith('-')) {
        const nextLine = lines[i + 1].trim();

        // Check if it's a date/period line
        if (isDateLine(nextLine) || parsePeriod(nextLine)) {
          periodLine = nextLine;
          i++; // Skip this line

          // Check if there's a subtitle after the period
          if (
            i + 1 < lines.length &&
            !lines[i + 1].startsWith('-') &&
            !isMainSectionHeader(lines[i + 1])
          ) {
            const potentialSubtitle = lines[i + 1].trim();
            if (potentialSubtitle && !isDateLine(potentialSubtitle)) {
              subtitleLine = potentialSubtitle;
              i++; // Skip this line too
            }
          }
        }
        // If not a date line, it might be a subtitle
        else if (!isMainSectionHeader(nextLine) && !isSubsectionHeader(nextLine)) {
          subtitleLine = nextLine;
          i++; // Skip this line

          // Check if there's a period after the subtitle
          if (i + 1 < lines.length && !lines[i + 1].startsWith('-')) {
            const potentialPeriod = lines[i + 1].trim();
            if (isDateLine(potentialPeriod) || parsePeriod(potentialPeriod)) {
              periodLine = potentialPeriod;
              i++; // Skip this line too
            }
          }
        }
      }

      // If we have a period or this is a new item title
      if (periodLine || subtitleLine || !currentItem) {
        if (currentItem) {
          if (currentSubsection) {
            if (!currentSubsection.items) currentSubsection.items = [];
            currentSubsection.items.push(currentItem);
          } else {
            currentSection.items.push(currentItem);
          }
        }

        // Check if this is a date line
        if (isDateLine(line) && currentSection) {
          // If we have a previous item, add the date
          if (currentSection.items.length > 0) {
            const lastItem = currentSection.items[currentSection.items.length - 1];
            if (!lastItem.date) {
              lastItem.date = line;
            }
          } else {
            // If no previous item, create a placeholder that will be attached to the next item
            currentItem = {
              title: '',
              date: line,
            };
          }
        } else {
          // Regular item title
          currentItem = {
            title: line,
          };

          // Add subtitle if available
          if (subtitleLine) {
            currentItem.subtitle = subtitleLine;
          }

          // Add period if available
          if (periodLine) {
            // Try to parse as a period first
            const period = parsePeriod(periodLine);
            if (period) {
              currentItem.period = period;
            } else if (isDateLine(periodLine)) {
              // If not a period but still a date, use as date
              currentItem.date = periodLine;
            }
          }
        }
      }
      continue;
    }

    // Bullet points become details
    if (line.startsWith('-')) {
      const detail = line.substring(1).trim();

      // Add to the appropriate item
      if (currentItem) {
        if (!currentItem.details) {
          currentItem.details = [];
        }
        currentItem.details.push(detail);
      } else if (currentSubsection) {
        if (!currentSubsection.details) {
          currentSubsection.details = [];
        }
        currentSubsection.details.push(detail);
      } else if (currentSection) {
        // Create a generic item for the bullet point if no current item
        currentItem = {
          title: '',
          details: [detail],
        };
        currentSection.items.push(currentItem);
        currentItem = null;
      }
    }
  }

  // Add final items
  if (currentItem) {
    if (currentSubsection) {
      if (!currentSubsection.items) currentSubsection.items = [];
      currentSubsection.items.push(currentItem);
    } else if (currentSection) {
      currentSection.items.push(currentItem);
    }
  }

  if (currentSubsection && currentSection) {
    currentSection.items.push(currentSubsection);
  }

  // Consolidate sections with the same title
  const uniqueSections: ResumeSection[] = [];
  const processedTitles = new Set<string>();

  for (const section of sections) {
    if (!processedTitles.has(section.title)) {
      processedTitles.add(section.title);

      // Find all sections with this title
      const matchingSections = sections.filter((s) => s.title === section.title);

      if (matchingSections.length === 1) {
        // Just one section with this title, add it directly
        uniqueSections.push(section);
      } else {
        // Multiple sections with the same title, merge their items
        const mergedSection: ResumeSection = {
          title: section.title,
          items: [],
        };

        for (const matchingSection of matchingSections) {
          mergedSection.items.push(...matchingSection.items);
        }

        uniqueSections.push(mergedSection);
      }
    }
  }

  // Post-processing to consolidate related items in all sections
  for (const section of uniqueSections) {
    // Group items that might be related (title + subtitle/date combinations)
    const processedItems: ResumeItem[] = [];
    const itemsToProcess = [...section.items];

    // Process items with titles first
    const titledItems = itemsToProcess.filter((item) => item.title && item.title.trim() !== '');
    const untitledItems = itemsToProcess.filter((item) => !item.title || item.title.trim() === '');

    // Add titled items first
    for (const item of titledItems) {
      processedItems.push(item);
    }

    // Then add untitled items (usually bullet points without a header)
    for (const item of untitledItems) {
      // Try to find a related item to attach to
      const lastItem = processedItems[processedItems.length - 1];
      if (lastItem && !item.title) {
        // Merge details
        if (item.details) {
          if (!lastItem.details) {
            lastItem.details = [];
          }
          lastItem.details.push(...item.details);
        }

        // Merge date if not present
        if (item.date && !lastItem.date) {
          lastItem.date = item.date;
        }
      } else {
        // If can't find a related item, add as is
        processedItems.push(item);
      }
    }

    section.items = processedItems;
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
    sections: uniqueSections,
  };
}
