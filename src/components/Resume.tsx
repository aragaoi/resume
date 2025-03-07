import React from 'react';
import { Resume as ResumeType } from '../types/Resume';
import { ResumeSection } from './ResumeSection';
import websiteTypes from '../config/website-types.json';

interface ResumeProps {
  resume: ResumeType;
  onBack: () => void;
}

export const Resume: React.FC<ResumeProps> = ({ resume, onBack }) => {
  return (
    <div className="min-h-screen bg-[#f0f4f8] dark:bg-gray-900 py-12 px-4 print:p-0 print:bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-sm z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-primary">Resume Builder</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-primary hover:text-secondary transition-colors duration-200 
                border border-primary px-4 py-2 rounded-medium font-medium
                hover:bg-primary hover:text-white"
            >
              Upload Different File
            </button>
            <button
              onClick={() => window.print()}
              className="bg-primary text-white px-4 py-2 rounded-medium font-medium
                hover:bg-secondary transition-colors duration-200 shadow-md
                hover:shadow-lg active:shadow-sm flex items-center gap-2"
            >
              <span>🖨️</span>
              Print Resume
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-16 print:mt-0">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden print:shadow-none">
          {/* Header */}
          <header className="p-8 pb-6 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 print:bg-none">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-primary dark:text-white">
                {resume.name}
              </h1>
              {resume.title && (
                <p className="text-xl text-secondary dark:text-gray-300 font-medium">
                  {resume.title}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-muted">
              {resume.contact.email && (
                <a
                  href={`mailto:${resume.contact.email}`}
                  className="flex items-center hover:text-primary transition-colors duration-200 
                    bg-white/50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full"
                >
                  <span className="inline-block w-4 mr-2 print:hidden">✉️</span>
                  {resume.contact.email}
                </a>
              )}
              {resume.contact.phone && (
                <span className="flex items-center bg-white/50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full">
                  <span className="inline-block w-4 mr-2 print:hidden">📱</span>
                  {resume.contact.phone}
                </span>
              )}
              {resume.contact.location && (
                <span className="flex items-center bg-white/50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full">
                  <span className="inline-block w-4 mr-2 print:hidden">📍</span>
                  {resume.contact.location}
                </span>
              )}
              {resume.contact.websites?.map((website, index) => (
                <a
                  key={index}
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary transition-colors duration-200
                    bg-white/50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full"
                >
                  <span className="inline-block w-4 mr-2 print:hidden">
                    {websiteTypes[website.type]?.icon || websiteTypes.other.icon}
                  </span>
                  <span>
                    {website.label || websiteTypes[website.type]?.label || websiteTypes.other.label}
                  </span>
                </a>
              ))}
            </div>
          </header>

          {/* Resume Sections */}
          <main className="p-8 space-y-8 bg-white dark:bg-gray-800">
            {resume.sections.map((section, index) => (
              <ResumeSection
                key={index}
                section={section}
                isLast={index === resume.sections.length - 1}
              />
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};
