import React, { useState, useEffect } from 'react';
import { ResumeSection as ResumeSectionType } from '../types/Resume';
import { ResumeSection } from './ResumeSection';
import { PrintSection } from './PrintSection';

interface ResumeSectionsProps {
  sections: Record<string, ResumeSectionType>;
}

export const ResumeSections: React.FC<ResumeSectionsProps> = ({ sections }) => {
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    // Set the active tab when sections change
    const keys = Object.keys(sections);
    if (keys.length > 0) {
      setActiveTab(keys[0]);
    }
  }, [sections]);

  if (Object.keys(sections).length === 0) {
    return <div>No sections to display</div>;
  }

  return (
    <>
      <div className="print:hidden mb-8">
        <div className="tabs">
          {Object.keys(sections).map((key) => (
            <a
              key={key}
              className={`tab tab-bordered ${activeTab === key ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {sections[key].title}
            </a>
          ))}
        </div>

        <div className="mt-6">
          {Object.entries(sections).map(([key, section]) => (
            <div key={key} id={key} className={activeTab === key ? 'block' : 'hidden'}>
              <ResumeSection section={section} />
            </div>
          ))}
        </div>
      </div>

      {/* Print version - all sections visible */}
      <div className="hidden print:block space-y-8">
        {Object.entries(sections).map(([key, section]) => (
          <div key={key} id={key}>
            <PrintSection section={section} />
          </div>
        ))}
      </div>
    </>
  );
};
