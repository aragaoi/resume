import { Resume, ResumeSection, ResumeItem, Period, Website } from '../../types/Resume';
import { parseWebsiteType } from './website';

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
    return {
      start: periodMatch[1].trim(),
      end: periodMatch[2].trim() === 'Present' ? undefined : periodMatch[2].trim(),
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

    // Check for single paragraph content in a section (like a summary)
    if (
      currentSection &&
      currentSection.items.length === 0 &&
      !currentSubsection &&
      !currentItem &&
      !line.startsWith('-') &&
      !isSubsectionHeader(line) &&
      !isDateLine(line)
    ) {
      // This is likely a direct section content (like a summary)
      currentItem = {
        title: '',
        content: [line],
      };

      // Collect any additional paragraph lines that might follow
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() &&
        !lines[i + 1].trim().startsWith('-') &&
        !isMainSectionHeader(lines[i + 1].trim()) &&
        !isSubsectionHeader(lines[i + 1].trim()) &&
        !isDateLine(lines[i + 1].trim())
      ) {
        i++;
        if (!currentItem.content) {
          currentItem.content = [];
        }
        currentItem.content.push(lines[i].trim());
      }

      currentSection.items.push(currentItem);
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
        if (isDateLine(line)) {
          // If we have a previous item, add the date
          if (currentSection.items.length > 0) {
            const lastItem = currentSection.items[currentSection.items.length - 1];
            if (!lastItem.period) {
              const period = parsePeriod(line);
              if (period) {
                lastItem.period = period;
              } else if (!lastItem.period) {
                lastItem.period = {
                  start: line,
                };
              }
            }
          } else {
            // If no previous item, create a placeholder that will be attached to the next item
            currentItem = {
              title: '',
              period: {
                start: line,
              },
            };
            currentSection.items.push(currentItem);
            currentItem = null;
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
            // Try to process as a date line
            // Date lines are either one date or a range of dates
            const period = parsePeriod(periodLine);
            if (period) {
              currentItem.period = period;
            } else {
              // Single date
              currentItem.period = {
                start: periodLine,
              };
            }
          }
        }
      }
      continue;
    }

    // Bullet points become content
    if (line.startsWith('-')) {
      const detail = line.substring(1).trim();

      // Add to the appropriate item
      if (currentItem) {
        if (!currentItem.content) {
          currentItem.content = [];
        }
        currentItem.content.push(detail);
      } else if (currentSubsection) {
        if (!currentSubsection.content) {
          currentSubsection.content = [];
        }
        currentSubsection.content.push(detail);
      } else if (currentSection) {
        // Create a generic item for the bullet point if no current item
        currentItem = {
          title: '',
          content: [detail],
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
    // Group items that might be related (title + subtitle/period combinations)
    if (section.items.length < 2) continue;

    const processedItems: ResumeItem[] = [];
    let lastItem: ResumeItem | null = null;

    for (const item of section.items) {
      if (!lastItem) {
        lastItem = { ...item };
        processedItems.push(lastItem);
        continue;
      }

      // See if this item should be merged with the last one
      if (!item.title && lastItem.title) {
        // Merge period if not present
        if (item.period && !lastItem.period) {
          lastItem.period = item.period;
        }
        // Merge content
        if (item.content) {
          if (!lastItem.content) {
            lastItem.content = [];
          }
          lastItem.content.push(...item.content);
        }
        // For backward compatibility, also merge details if present
        if ((item as any).details) {
          if (!lastItem.content) {
            lastItem.content = [];
          }
          lastItem.content.push(...(item as any).details);
        }
      } else {
        // If can't find a related item, add as is
        processedItems.push(item);
      }
    }

    section.items = processedItems;
  }

  // Merge duplicated items
  const mergedSections: ResumeSection[] = [];
  for (const section of uniqueSections) {
    const mergedSection = { ...section };

    // Merge items with the same title in each section
    if (section.items.length > 1) {
      const mergedItems: ResumeItem[] = [];
      const seenTitles = new Set<string>();

      for (const item of section.items) {
        if (!item.title) continue;

        const existingItem = mergedItems.find((mi) => mi.title === item.title);
        if (existingItem) {
          // Merge the items
          if (item.subtitle) existingItem.subtitle = item.subtitle;
          if (item.period) existingItem.period = item.period;
          if (item.description) existingItem.description = item.description;

          // Merge content
          if (item.content) {
            if (!existingItem.content) {
              existingItem.content = [];
            }
            existingItem.content.push(...item.content);
          }

          // For backward compatibility, also merge details if present
          if ((item as any).details) {
            if (!existingItem.content) {
              existingItem.content = [];
            }
            existingItem.content.push(...(item as any).details);
          }

          // Merge any other fields as needed
        } else {
          mergedItems.push({ ...item });
          seenTitles.add(item.title);
        }
      }

      mergedSection.items = mergedItems;
    }

    mergedSections.push(mergedSection);
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
    sections: mergedSections,
  };
}
