import { Resume, ResumeSection, Period } from '../../types/Resume';
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

export const parsePlainText = (content: string): Resume => {
  const lines = content.split('\n');
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  const contactInfo: any = {
    websites: [],
  };

  let isContactSection = false;
  let name = '';

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const normalizedLine = trimmedLine.toLowerCase();

    // Skip empty lines
    if (!trimmedLine) {
      if (currentSection && currentSection.content.length > 0) {
        sections.push(currentSection);
        currentSection = null;
      }
      isContactSection = false;
      return;
    }

    // First non-empty line is the name
    if (!name) {
      name = trimmedLine;
      return;
    }

    // Contact section detection
    if (normalizedLine === 'contact information:') {
      isContactSection = true;
      return;
    }

    if (isContactSection) {
      if (normalizedLine.startsWith('email:')) {
        contactInfo.email = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
      } else if (normalizedLine.startsWith('phone:')) {
        contactInfo.phone = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
      } else if (normalizedLine.startsWith('location:')) {
        contactInfo.location = trimmedLine.substring(trimmedLine.indexOf(':') + 1).trim();
      } else {
        const website = parseWebsiteType(trimmedLine);
        if (website) {
          contactInfo.websites.push(website);
        }
      }
      return;
    }

    // Section headers are in all caps
    if (trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.startsWith('•')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmedLine,
        content: [],
      };
      return;
    }

    // Subsection detection (non-empty line followed by empty line)
    if (currentSection && !trimmedLine.startsWith('•') && lines[index + 1]?.trim() === '') {
      const period = parsePeriod(trimmedLine);
      const subsection: ResumeSection = {
        title: period ? trimmedLine.split(' - ')[0].trim() : trimmedLine,
        content: [],
      };
      if (period) {
        subsection.period = period;
      }
      currentSection.content.push(subsection);
      return;
    }

    // Bullet points
    if (currentSection && trimmedLine.startsWith('•')) {
      const content = trimmedLine.substring(1).trim();
      if (typeof currentSection.content[currentSection.content.length - 1] === 'object') {
        (currentSection.content[currentSection.content.length - 1] as ResumeSection).content.push(
          content
        );
      } else {
        currentSection.content.push(content);
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return {
    name,
    contact: contactInfo,
    sections,
  };
};
