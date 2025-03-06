import { marked } from 'marked';
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

export const parseMarkdownContent = (content: string): Resume => {
  const tokens = marked.lexer(content);
  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let contactInfo: any = {
    websites: [],
  };

  tokens.forEach((token) => {
    if (token.type === 'heading') {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: token.text.replace(/\[|\]/g, ''),
        content: [],
      };
    } else if (currentSection && token.type === 'paragraph') {
      if (sections.length === 0) {
        const lines = token.text.split('\n');
        lines.forEach((line) => {
          const normalizedLine = line.toLowerCase();
          if (normalizedLine.startsWith('email:')) {
            contactInfo.email = line.substring(6).trim();
          } else if (normalizedLine.startsWith('phone:')) {
            contactInfo.phone = line.substring(6).trim();
          } else if (normalizedLine.startsWith('location:')) {
            contactInfo.location = line.substring(9).trim();
          } else {
            const website = parseWebsiteType(line);
            if (website) {
              contactInfo.websites.push(website);
            }
          }
        });
      } else {
        const period = parsePeriod(token.text);
        if (period) {
          (currentSection as any).period = period;
        } else {
          (currentSection.content as string[]).push(token.text.replace(/\[|\]/g, ''));
        }
      }
    } else if (currentSection && token.type === 'list') {
      (currentSection.content as string[]).push(
        ...token.items.map((item: any) => item.text.replace(/\[|\]/g, ''))
      );
    }
  });

  if (currentSection) sections.push(currentSection);

  return {
    name: sections[0]?.title || 'Unnamed',
    contact: contactInfo,
    sections: sections.slice(1),
  };
};
