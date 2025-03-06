import React from 'react';
import { ResumeSection as ResumeSectionType } from '../types/Resume';

interface ResumeSectionProps {
  section: ResumeSectionType;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({ section }) => {
  const renderContent = (content: ResumeSectionType['content']) => {
    if (Array.isArray(content)) {
      if (content.length > 0 && typeof content[0] === 'object') {
        return content.map((subsection, index) => (
          <ResumeSection key={index} section={subsection as ResumeSectionType} />
        ));
      }
      return (
        <ul className="list-disc ml-6">
          {content.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    return <p className="mt-2">{content}</p>;
  };

  const headingClasses = {
    1: 'text-2xl font-bold mb-3',
    2: 'text-xl font-semibold mb-2',
    3: 'text-lg font-medium mb-2',
    4: 'text-base font-medium mb-2',
    5: 'text-sm font-medium mb-2',
    6: 'text-xs font-medium mb-2',
  };

  return (
    <section className={`mb-6 ml-${(section.level - 1) * 4}`}>
      <h2
        className={
          headingClasses[section.level as keyof typeof headingClasses] || headingClasses[1]
        }
      >
        {section.title}
      </h2>
      {renderContent(section.content)}
    </section>
  );
};
