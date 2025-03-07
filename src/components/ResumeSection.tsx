import React from 'react';
import { ResumeSection as ResumeSectionType } from '../types/Resume';

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
              <h3 className="text-lg font-semibold text-secondary dark:text-blue-300">
                {subsection.title}
              </h3>
              {subsection.period && (
                <span className="text-sm text-muted dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full">
                  {subsection.period.start}
                  {subsection.period.end && ` - ${subsection.period.end}`}
                </span>
              )}
            </div>
            <div className="pl-4 border-l-2 border-[var(--color-border)] dark:border-gray-600 py-2 print:border-gray-300">
              {renderContent(subsection.content)}
            </div>
          </div>
        ));
      }
      return (
        <ul className="list-disc ml-4 space-y-2 text-[var(--color-text)] dark:text-gray-300">
          {content.map((item, index) => (
            <li key={index} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="mt-2 text-[var(--color-text)] dark:text-gray-300">{content}</p>;
  };

  return (
    <section
      className={`${
        !isLast
          ? 'mb-8 pb-8 border-b border-[var(--color-border)] dark:border-gray-700 print:border-gray-300'
          : ''
      }`}
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
