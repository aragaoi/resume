import { Resume, ResumeSection, ResumeItem, Website } from '../../types/Resume';
import { marked } from 'marked';
import { parseWebsiteType } from './website';

// Constants for string literals
const HEADING_TYPES = {
  MAIN: 1, // H1
  SECTION: 2, // H2
  SUBSECTION: 3, // H3
};

const CONTACT_FIELDS = {
  EMAIL: 'Email:',
  PHONE: 'Phone:',
  LOCATION: 'Location:',
  WEBSITE: 'Website:',
  PORTFOLIO: 'Portfolio:',
  LINKEDIN: 'LinkedIn:',
};

const DATE_PRESENT = 'Present';

// Regular expression for matching date ranges
const DATE_RANGE_REGEX =
  /((?:[a-zA-Z]{3,}\.?|[a-zA-Z]{3})[\s.]?\d{4}|(?:\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}|\d{1,2}[\/]\d{2}|\d{4}))\s*[-–]?\s*(.+)?/;

// Add a new function to check if a string is likely a date
const isLikelyDate = (text: string): boolean => {
  // Check for year formats (YYYY or YY)
  const hasYear = /\b(19|20)\d{2}\b/.test(text);
  const hasShortYear = /\b\d{2}\b/.test(text);

  // Check for month names or abbreviations
  const hasMonth = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\b/i.test(text);

  // Check for formatted dates (MM/YY, MM-YYYY, etc.)
  const hasFormattedDate =
    /\b\d{1,2}[-\/]\d{2,4}\b/.test(text) || /\b\d{4}[-\/]\d{1,2}\b/.test(text);

  return hasYear || (hasMonth && (hasYear || hasShortYear)) || hasFormattedDate;
};

/**
 * Helper to extract contact information from a line of text
 */
const extractContactInfo = (
  line: string,
  websites: Website[]
): { field: string; value: string } | null => {
  if (line.startsWith(CONTACT_FIELDS.EMAIL)) {
    return { field: 'email', value: line.replace(CONTACT_FIELDS.EMAIL, '').trim() };
  } else if (line.startsWith(CONTACT_FIELDS.PHONE)) {
    return { field: 'phone', value: line.replace(CONTACT_FIELDS.PHONE, '').trim() };
  } else if (line.startsWith(CONTACT_FIELDS.LOCATION)) {
    return { field: 'location', value: line.replace(CONTACT_FIELDS.LOCATION, '').trim() };
  } else if (
    line.startsWith(CONTACT_FIELDS.WEBSITE) ||
    line.startsWith(CONTACT_FIELDS.PORTFOLIO) ||
    line.startsWith(CONTACT_FIELDS.LINKEDIN)
  ) {
    const website = parseWebsiteType(line);
    if (website) {
      websites.push(website);
    }
  }
  return null;
};

/**
 * Parses a date range from text
 */
const parseDateRange = (text: string): { start: string; end?: string } | null => {
  // If it doesn't look like a date, don't try to parse it
  if (!isLikelyDate(text)) {
    return null;
  }

  console.log(`\nParsing date range from: "${text}"`);

  const dateMatch = text.match(DATE_RANGE_REGEX);

  if (dateMatch) {
    console.log('  Date match groups:', JSON.stringify(dateMatch));

    // If there's a match but no second group, it's a single date (no range)
    if (dateMatch[1] && !dateMatch[2]) {
      console.log('  Single date detected (no range)');
      return {
        start: dateMatch[1].trim(),
      };
    }

    // If the second group exists but doesn't look like a date, it might be "Present" or similar
    if (dateMatch[2] && !isLikelyDate(dateMatch[2]) && dateMatch[2].trim() !== DATE_PRESENT) {
      console.log('  Second group exists but not a date or "Present":', dateMatch[2]);
      return {
        start: dateMatch[1].trim(),
      };
    }

    // Handle "Present" explicitly
    if (dateMatch[2]?.trim() === DATE_PRESENT) {
      console.log('  "Present" date detected');
    }

    const result = {
      start: dateMatch[1].trim(),
      end: dateMatch[2]?.trim() === DATE_PRESENT ? undefined : dateMatch[2]?.trim(),
    };

    console.log('  Returning date range:', JSON.stringify(result));
    return result;
  }

  // If there's no range pattern but the text looks like a date, treat it as a start date
  if (isLikelyDate(text) && text.trim().length < 20) {
    console.log('  No range pattern, but looks like a date - treating as start date');
    return {
      start: text.trim(),
    };
  }

  console.log('  Not recognized as a date');
  return null;
};

// Define state interface for parsing
interface ParserState {
  name: string;
  title: string;
  currentSection: ResumeSection | null;
  currentItem: ResumeItem | null;
  sections: ResumeSection[];
  email: string;
  phone: string;
  location: string;
  websites: Website[];
}

/**
 * Process a token to extract section and item data
 */
const processToken = (token: any, state: ParserState): void => {
  if (token.type === 'heading') {
    processHeading(token, state);
  } else if (token.type === 'paragraph' && token.text) {
    processParagraph(token, state);
  } else if (token.type === 'list' && token.items) {
    processList(token, state);
  }
};

/**
 * Process a heading token
 */
const processHeading = (token: any, state: ParserState): void => {
  if (token.depth === HEADING_TYPES.MAIN) {
    if (!state.name) {
      state.name = token.text;
    } else {
      // New main section
      addCurrentItemToSection(state);
      addCurrentSectionToSections(state);

      state.currentSection = {
        title: token.text,
        items: [],
      };

      // We no longer preemptively create a default item
      // Instead, we'll create it when we encounter content
    }
  } else if (token.depth === HEADING_TYPES.SECTION) {
    if (state.currentSection) {
      addCurrentItemToSection(state);
      state.currentItem = {
        title: token.text,
      };
    } else if (!state.title) {
      state.title = token.text;
    }
  } else if (token.depth === HEADING_TYPES.SUBSECTION && state.currentSection) {
    if (state.currentItem) {
      processSubsectionHeading(token.text, state);
    }
  }
};

/**
 * Process a subsection heading
 */
const processSubsectionHeading = (text: string, state: ParserState): void => {
  if (!state.currentSection || !state.currentItem) return;

  // Treat all H3 as nested items consistently, regardless of section title
  if (!state.currentItem.items) {
    state.currentItem.items = [];
  }
  state.currentItem.items.push({
    title: text,
    content: [],
  });
};

/**
 * Process a paragraph token
 */
const processParagraph = (token: any, state: ParserState): void => {
  if (!token.text) return;

  // Split the paragraph into lines to handle multiple contact info in one paragraph
  const lines = token.text.split('\n');

  if (!state.currentSection) {
    // We're in the header section, process contact information
    processContactLines(lines, state);
  } else {
    // Check if the paragraph appears to be a date range
    const dateRange = parseDateRange(token.text);

    // Find any existing empty-titled item in the current section
    // We'll try to reuse this for paragraph-style content
    let emptyTitledItem: ResumeItem | null = null;
    let emptyTitledItemIndex = -1;
    if (state.currentSection.items) {
      for (let i = 0; i < state.currentSection.items.length; i++) {
        if (state.currentSection.items[i].title === '') {
          emptyTitledItem = state.currentSection.items[i];
          emptyTitledItemIndex = i;
          break;
        }
      }
    }

    // If this is the first paragraph after a main section heading (H1),
    // and it's not a date, it's likely a paragraph-style section
    const isFirstParagraphInMainSection =
      state.currentSection.items.length === 0 && !state.currentItem && !dateRange;

    // If we're already in an untitled item, continue adding to it
    const continueUntitledItem = state.currentItem && state.currentItem.title === '' && !dateRange;

    // We've found an existing empty-titled item and we're not currently in an item
    const shouldReuseExistingItem = emptyTitledItem !== null && !state.currentItem && !dateRange;

    if (isFirstParagraphInMainSection || continueUntitledItem || shouldReuseExistingItem) {
      // For paragraph-style sections, we want all content to go into a single item
      if (shouldReuseExistingItem && emptyTitledItem && emptyTitledItemIndex !== -1) {
        // Remove the item from the section's items since we'll reuse it
        // This prevents it from being added to the section again later
        state.currentSection.items.splice(emptyTitledItemIndex, 1);

        // Use the existing empty-titled item
        state.currentItem = emptyTitledItem;
      } else if (!state.currentItem || state.currentItem.title !== '') {
        // Create a new empty-titled item if needed
        state.currentItem = {
          title: '',
          content: [],
        };
      }

      // Now state.currentItem is definitely not null
      if (state.currentItem) {
        // Add the paragraph to the content
        if (!state.currentItem.content) {
          state.currentItem.content = [];
        }
        state.currentItem.content.push(token.text);
      }
    } else if (!state.currentItem) {
      // For other sections without a current item
      if (dateRange) {
        // It's a date, create an item with a period but no title yet
        state.currentItem = {
          title: '',
          period: dateRange,
        };
      } else {
        // It's not a date, create an item with this as the description
        state.currentItem = {
          title: '',
          content: [token.text],
        };
      }
    } else {
      // We have a current item with a title
      if (dateRange) {
        // If it's a date, handle it as a period
        state.currentItem.period = dateRange;
      } else {
        // Normal item processing for items with titles
        processItemContent(token.text, state);
      }
    }
  }
};

/**
 * Process contact information lines
 */
const processContactLines = (lines: string[], state: ParserState): void => {
  for (const line of lines) {
    const contactInfo = extractContactInfo(line, state.websites);
    if (contactInfo) {
      if (contactInfo.field === 'email') state.email = contactInfo.value;
      else if (contactInfo.field === 'phone') state.phone = contactInfo.value;
      else if (contactInfo.field === 'location') state.location = contactInfo.value;
    }
  }
};

/**
 * Process content text for an item
 */
const processItemContent = (text: string, state: ParserState): void => {
  if (!state.currentItem) return;

  const dateRange = parseDateRange(text);

  if (dateRange) {
    state.currentItem.period = dateRange;
  } else if (!state.currentItem.description) {
    state.currentItem.description = text;
  } else if (!state.currentItem.subtitle) {
    state.currentItem.subtitle = text;
  } else if (!state.currentItem.content) {
    state.currentItem.content = [text];
  } else {
    state.currentItem.content.push(text);
  }
};

/**
 * Process a list token
 */
const processList = (token: any, state: ParserState): void => {
  if (!token.items || !state.currentItem) return;

  if (!state.currentItem.content) {
    state.currentItem.content = [];
  }

  state.currentItem.content.push(...token.items.map((item: any) => item.text));
};

/**
 * Add current item to section if it exists
 */
const addCurrentItemToSection = (state: ParserState): void => {
  if (state.currentItem && state.currentSection) {
    // Add the current item to the section
    state.currentSection.items.push(state.currentItem);

    // Clear the current item
    state.currentItem = null;
  }
};

/**
 * Add current section to sections if it exists
 */
const addCurrentSectionToSections = (state: ParserState): void => {
  if (state.currentSection) {
    state.sections.push(state.currentSection);
  }
};

/**
 * Parse Markdown content into a Resume object
 */
export function parseMarkdown(markdown: string): Resume {
  const tokens = marked.lexer(markdown);

  // State object to track parsing context
  const state: ParserState = {
    sections: [],
    currentSection: null,
    currentItem: null,
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    websites: [],
  };

  // Process each token
  for (const token of tokens) {
    processToken(token, state);
  }

  // Add the last item and section if they exist
  addCurrentItemToSection(state);
  addCurrentSectionToSections(state);

  // Construct the resume
  const resume = {
    name: state.name,
    title: state.title,
    contact: {
      email: state.email,
      phone: state.phone,
      location: state.location,
      websites: state.websites,
    },
    sections: state.sections,
  };

  console.log('==== MARKDOWN PARSING COMPLETED ====');
  console.log('Resume name:', resume.name);
  console.log('Resume sections:');

  // Print detailed information about each section
  resume.sections.forEach((section) => {
    console.log(`\nSection: ${section.title}, Items: ${section.items.length}`);

    section.items.forEach((item) => {
      console.log(`  Item: ${item.title}`);
      if (item.period) {
        console.log(`    Period: ${JSON.stringify(item.period)}`);
        console.log(`    Period start type: ${typeof item.period.start}`);
        console.log(`    Period end type: ${typeof item.period.end}`);
        console.log(`    Period end value: ${item.period.end}`);
      }
    });
  });

  return resume;
}
