import React from 'react';
import { ResumeSection } from './ResumeSection';
import { ResumeSection as ResumeSectionType } from '../types/Resume';

interface PrintSectionProps {
  section: ResumeSectionType;
}

export const PrintSection: React.FC<PrintSectionProps> = ({ section }) => {
  return (
    <div className="hidden print:block">
      <ResumeSection section={section} isPrint />
    </div>
  );
};
