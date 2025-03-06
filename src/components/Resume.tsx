import React from 'react';
import { Resume as ResumeType } from '../types/Resume';
import { ResumeSection } from './ResumeSection';
import websiteTypes from '../config/website-types.json';

interface ResumeProps {
  resume: ResumeType;
}

export const Resume: React.FC<ResumeProps> = ({ resume }) => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{resume.name}</h1>
        {resume.title && <p className="text-xl mb-4">{resume.title}</p>}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          {resume.contact.email && (
            <a href={`mailto:${resume.contact.email}`} className="hover:underline">
              {resume.contact.email}
            </a>
          )}
          {resume.contact.phone && <span>{resume.contact.phone}</span>}
          {resume.contact.location && <span>{resume.contact.location}</span>}
          {resume.contact.websites?.map((website, index) => (
            <a
              key={index}
              href={website.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <span>{websiteTypes[website.type]?.icon || websiteTypes.other.icon}</span>
              <span>
                {website.label || websiteTypes[website.type]?.label || websiteTypes.other.label}
              </span>
            </a>
          ))}
        </div>
      </header>

      <main>
        {resume.sections.map((section, index) => (
          <ResumeSection key={index} section={section} />
        ))}
      </main>
    </div>
  );
};
