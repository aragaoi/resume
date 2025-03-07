import React from 'react';
import { ResumeSection as ResumeSectionType } from '../types/Resume';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

interface ResumeSectionProps {
  section: ResumeSectionType;
  isLast?: boolean;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({ section, isLast }) => {
  const renderContent = (content: ResumeSectionType['content']) => {
    if (Array.isArray(content)) {
      if (content.length > 0 && typeof content[0] === 'object') {
        return content.map((subsection, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1 mb-3">
              <HoverCard>
                <HoverCardTrigger>
                  <h3 className="text-lg font-semibold text-secondary dark:text-blue-300">
                    {subsection.title}
                  </h3>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">{subsection.title}</h4>
                    {subsection.period && (
                      <p className="text-sm text-muted-foreground">
                        {subsection.period.start} - {subsection.period.end || 'Present'}
                      </p>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
              {subsection.period && (
                <span className="text-sm bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">
                  {subsection.period.start}
                  {subsection.period.end && ` - ${subsection.period.end}`}
                </span>
              )}
            </div>
            <div className="pl-4 border-l-2 border-[var(--border)] dark:border-gray-600 py-2 print:border-gray-300">
              {renderContent(subsection.content)}
            </div>
          </div>
        ));
      }
      return (
        <ul className="list-disc ml-4 space-y-2 text-[var(--foreground)] marker:text-muted-foreground">
          {content.map((item, index) => (
            <li key={index} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="mt-2 text-[var(--foreground)]">{content}</p>;
  };

  return (
    <section
      className={cn(
        'relative',
        !isLast &&
          'mb-8 pb-8 border-b border-[var(--border)] dark:border-gray-700 print:border-gray-300'
      )}
    >
      <div className="flex items-center mb-6">
        <span
          className="mr-3 w-8 h-8 flex items-center justify-center bg-primary/10 dark:bg-primary/20 
          rounded-lg text-primary dark:text-blue-300 print:hidden"
        >
          {getSectionIcon(section.title)}
        </span>
        <h2 className="text-2xl font-bold text-primary dark:text-white">{section.title}</h2>
      </div>
      {renderContent(section.content)}
    </section>
  );
};

const getSectionIcon = (title: string): string => {
  const lowercaseTitle = title.toLowerCase();
  switch (lowercaseTitle) {
    case 'experience':
      return '💼';
    case 'education':
      return '🎓';
    case 'skills':
      return '🛠️';
    case 'certifications':
      return '📜';
    case 'projects':
      return '🚀';
    case 'awards':
      return '🏆';
    case 'languages':
      return '🌐';
    case 'interests':
      return '⭐';
    default:
      return '📋';
  }
};
