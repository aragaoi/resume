import React from 'react';
import { ResumeSection as ResumeSectionType } from '../types/Resume';

interface ResumeSectionProps {
  section: ResumeSectionType;
  isPrint?: boolean;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({ section, isPrint }) => {
  // Check if this section should be rendered as paragraphs (without bullets)
  // This happens when:
  // 1. There's only one item in the section OR
  // 2. All items have only one content element
  const shouldRenderAsParagraphs =
    section.items.length === 1 ||
    section.items.every((item) => item.content && item.content.length === 1);

  return (
    <div className={`mb-8 ${isPrint ? 'print:mb-4' : ''}`}>
      <h2 className="text-2xl font-bold mb-6 print:text-xl print:mb-3">{section.title}</h2>
      {section.items && section.items.length > 0 ? (
        section.items.map((item, index) => (
          <React.Fragment key={index}>
            <div className="mb-8 print:mb-4">
              {/* Only show item title if we're not rendering everything as paragraphs */}
              {!shouldRenderAsParagraphs && item.title && (
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3 print:mb-2">
                  <div>
                    <h3 className="text-xl font-semibold print:text-lg">{item.title}</h3>
                    {item.subtitle && (
                      <p className="text-base opacity-75 print:text-sm">{item.subtitle}</p>
                    )}
                  </div>
                  {item.period && (
                    <div className="badge badge-lg badge-secondary whitespace-nowrap print:badge-md">
                      {item.period.start}
                      {item.period.end ? ` - ${item.period.end}` : ' - Present'}
                    </div>
                  )}
                </div>
              )}

              {/* Item description */}
              {item.description && (
                <p className="opacity-75 mt-2 whitespace-pre-line print:text-sm">
                  {item.description}
                </p>
              )}

              {/* Content rendering */}
              {item.content &&
                item.content.length > 0 &&
                (shouldRenderAsParagraphs || item.title === '' ? (
                  // Render as paragraphs
                  <div className="mt-2 space-y-4 print:mt-1 print:space-y-2">
                    {item.content.map((contentItem, contentIndex) => (
                      <p key={contentIndex} className="opacity-75 print:text-sm">
                        {contentItem}
                      </p>
                    ))}
                  </div>
                ) : (
                  // Render as bullet list
                  <ul className="mt-4 list-disc list-inside space-y-2 print:mt-2 print:space-y-1">
                    {item.content.map((contentItem, contentIndex) => (
                      <li key={contentIndex} className="opacity-75 print:text-sm">
                        {contentItem}
                      </li>
                    ))}
                  </ul>
                ))}

              {/* Tags */}
              {item.tags && (
                <div className="flex flex-wrap gap-2 mt-4 print:mt-2 print:gap-1">
                  {isPrint
                    ? item.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="text-sm opacity-70 print:text-xs">
                          {tag}
                          {tagIndex < item.tags!.length - 1 ? ' • ' : ''}
                        </span>
                      ))
                    : item.tags.map((tag, tagIndex) => (
                        <div key={tagIndex} className="badge print:badge-sm">
                          {tag}
                        </div>
                      ))}
                </div>
              )}
            </div>
            {index < section.items.length - 1 && <div className="divider my-6 print:my-3"></div>}
          </React.Fragment>
        ))
      ) : (
        <p className="text-center opacity-70">No items in this section</p>
      )}
    </div>
  );
};
