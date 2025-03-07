import { Resume, ResumeSection, ResumeItem, Period, Website } from '../../types/Resume';
import { parseWebsiteType } from './website';

const parsePeriod = (text: string): Period | undefined => {
  const periodMatch = text.match(/(.+)\s*-\s*(.+)/);
  if (periodMatch) {
    return {
      start: periodMatch[1].trim(),
      end: periodMatch[2].trim() === 'Present' ? undefined : periodMatch[2].trim(),
    };
  }
  return undefined;
};

export function parsePlainText(content: string): Resume {
  const lines = content.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let currentItem: ResumeItem | null = null;
  let name = '';
  let title = '';
  let email = '';
  let phone = '';
  let location = '';
  const websites: Website[] = [];

  let isContactSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
        currentItem = null;
      }
      continue;
    }

    // First non-empty line is the name
    if (!name) {
      name = line;
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
      } else {
        const website = parseWebsiteType(line);
        if (website) {
          websites.push(website);
        } else {
          isContactSection = false;
        }
      }
      if (isContactSection) continue;
    }

    // Section headers are in all caps
    if (line === line.toUpperCase() && !line.startsWith('•') && !line.startsWith('-')) {
      if (currentItem && currentSection) {
        currentSection.items.push(currentItem);
      }
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line,
        items: [],
      };
      currentItem = null;
      continue;
    }

    // Item titles and periods
    if (currentSection && !line.startsWith('•') && !line.startsWith('-')) {
      if (currentItem) {
        currentSection.items.push(currentItem);
      }
      const period = parsePeriod(line);
      if (period) {
        currentItem = {
          title: line.split(' - ')[0].trim(),
          period,
        };
      } else {
        currentItem = {
          title: line,
        };
      }
      continue;
    }

    // Bullet points become details
    if (currentItem && (line.startsWith('•') || line.startsWith('-'))) {
      if (!currentItem.details) {
        currentItem.details = [];
      }
      currentItem.details.push(line.substring(1).trim());
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
