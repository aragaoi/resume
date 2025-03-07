import { Resume, ResumeSection, ResumeItem, Website } from '../../types/Resume';
import { marked } from 'marked';
import { parseWebsiteType } from './website';

export function parseMarkdown(markdown: string): Resume {
  const tokens = marked.lexer(markdown);
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let currentItem: ResumeItem | null = null;
  let name = '';
  let title = '';
  let email = '';
  let phone = '';
  let location = '';
  const websites: Website[] = [];

  for (const token of tokens) {
    if (token.type === 'heading') {
      if (token.depth === 1) {
        if (!name) {
          name = token.text;
        } else {
          // New main section
          if (currentItem && currentSection) {
            currentSection.items.push(currentItem);
            currentItem = null;
          }
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: token.text,
            items: [],
          };
        }
      } else if (token.depth === 2) {
        if (currentSection) {
          if (currentItem) {
            currentSection.items.push(currentItem);
          }
          currentItem = {
            title: token.text,
          };
        } else if (!title) {
          title = token.text;
        }
      } else if (token.depth === 3 && currentSection) {
        if (currentItem) {
          if (!currentItem.items) {
            currentItem.items = [];
          }
          currentItem.items.push({
            title: token.text,
            details: [],
          });
        }
      }
    } else if (token.type === 'paragraph' && token.text) {
      // Split the paragraph into lines to handle multiple contact info in one paragraph
      const lines = token.text.split('\n');

      if (!currentSection) {
        // We're in the header section, process contact information
        for (const line of lines) {
          if (line.startsWith('Email:')) {
            email = line.replace('Email:', '').trim();
          } else if (line.startsWith('Phone:')) {
            phone = line.replace('Phone:', '').trim();
          } else if (line.startsWith('Location:')) {
            location = line.replace('Location:', '').trim();
          } else if (
            line.startsWith('Website:') ||
            line.startsWith('Portfolio:') ||
            line.startsWith('LinkedIn:')
          ) {
            const website = parseWebsiteType(line);
            if (website) {
              websites.push(website);
            }
          }
        }
      } else if (currentItem) {
        // We're in a section item
        const text = token.text;

        // Check if it's a date range
        const dateMatch = text.match(/(\d{4})\s*-\s*(.+)/);
        if (dateMatch) {
          currentItem.period = {
            start: dateMatch[1].trim(),
            end: dateMatch[2].trim() === 'Present' ? undefined : dateMatch[2].trim(),
          };
        } else if (!currentItem.description) {
          currentItem.description = text;
        } else if (!currentItem.subtitle) {
          currentItem.subtitle = text;
        }
      }
    } else if (token.type === 'list' && token.items) {
      if (currentItem) {
        if (!currentItem.details) {
          currentItem.details = [];
        }
        currentItem.details.push(...token.items.map((item) => item.text));
      }
    }
  }

  // Add final items
  if (currentItem && currentSection) {
    currentSection.items.push(currentItem);
  }
  if (currentSection) {
    sections.push(currentSection);
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
    sections,
  };
}
