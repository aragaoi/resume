import React from 'react';
import { Resume as ResumeType } from '../types/Resume';
import websiteTypes from '../config/website-types.json';
import { Upload, Printer, FileDown } from 'lucide-react';
import { ResumeSections } from './ResumeSections';
import { ResumeSection } from './ResumeSection';
import { ThemeSwitcher } from './ThemeSwitcher';
import PdfExportButton from './PdfExportButton';

interface ResumeProps {
  resume: ResumeType;
  onBack: () => void;
}

export const Resume: React.FC<ResumeProps> = ({ resume, onBack }) => {
  // Create a sections object with lowercase keys for easier access
  const sections = resume.sections.reduce(
    (acc, section) => {
      acc[section.title.toLowerCase()] = section;
      return acc;
    },
    {} as Record<string, (typeof resume.sections)[0]>
  );

  // Generate a filename for the PDF based on the resume name or a default
  const pdfFileName = resume.name
    ? `${resume.name.replace(/\s+/g, '-').toLowerCase()}-resume.pdf`
    : 'resume.pdf';

  return (
    <div className="min-h-screen bg-base-100 py-12 px-4 print:p-0 print:m-0 resume-print-container">
      {/* Navigation Bar - This will be hidden when printing */}
      <div className="navbar bg-base-100 fixed top-0 left-0 right-0 z-50 shadow-sm print:hidden">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl">Resume Builder</a>
        </div>

        <div className="navbar-end">
          <button className="btn btn-ghost btn-sm mx-2" onClick={onBack}>
            <Upload className="w-4 h-4 mr-2" />
            Change File
          </button>

          <button className="btn btn-outline btn-sm mx-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>

          <PdfExportButton
            contentId="resume-content"
            fileName={pdfFileName}
            className="btn btn-primary btn-sm mx-2"
            resumeData={resume}
            useLocalApi={true}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </PdfExportButton>

          <ThemeSwitcher />
        </div>
      </div>

      {/* Main Content - This is what will be exported to PDF */}
      <div id="resume-content" className="max-w-4xl mx-auto mt-16 print:mt-0">
        <div className="card bg-base-100 shadow-xl overflow-hidden print:shadow-none print:border-0">
          {/* Header */}
          <div className="p-8 pb-6 bg-base-200 print:p-0 print:pb-4 border-b print:border-b-0">
            <div className="text-center mb-8 print:mb-4">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 print:text-4xl">{resume.name}</h1>
              {resume.title && (
                <p className="text-xl opacity-75 font-medium print:text-lg">{resume.title}</p>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap justify-center items-center gap-3 print:gap-2 print:block print:visible print:opacity-100">
              {resume.contact.email && (
                <div className="tooltip print:inline-block" data-tip="Send email">
                  <a
                    href={`mailto:${resume.contact.email}`}
                    className="badge badge-lg print:badge-md print:inline-flex print:visible print:opacity-100"
                  >
                    <span className="inline-block w-4 print:hidden">✉️</span>
                    {resume.contact.email}
                  </a>
                </div>
              )}
              {resume.contact.phone && (
                <div className="tooltip print:inline-block" data-tip="Call">
                  <a
                    href={`tel:${resume.contact.phone}`}
                    className="badge badge-lg print:badge-md print:inline-flex print:visible print:opacity-100"
                  >
                    <span className="inline-block w-4 print:hidden">📱</span>
                    {resume.contact.phone}
                  </a>
                </div>
              )}
              {resume.contact.location && (
                <div className="tooltip print:inline-block" data-tip="Location">
                  <span className="badge badge-lg print:badge-md print:inline-flex print:visible print:opacity-100">
                    <span className="inline-block w-4 print:hidden">📍</span>
                    {resume.contact.location}
                  </span>
                </div>
              )}
              {resume.contact.websites?.map((website, index) => (
                <div
                  className="tooltip print:inline-block"
                  key={index}
                  data-tip={`Visit ${website.type}`}
                >
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge badge-lg print:badge-md print:inline-flex print:visible print:opacity-100"
                  >
                    <span className="inline-block w-4 print:hidden">
                      {websiteTypes[website.type]?.icon || websiteTypes.other.icon}
                    </span>
                    <span>
                      {website.label ||
                        websiteTypes[website.type]?.label ||
                        websiteTypes.other.label}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Sections */}
          <div className="p-8 print:p-0 print:pt-4">
            {resume.sections.length > 0 ? (
              <div>
                <div className="print:hidden mb-8">
                  <div className="tabs tabs-bordered">
                    {resume.sections.map((section, index) => (
                      <a
                        key={index}
                        className={`tab ${index === 0 ? 'tab-active' : ''}`}
                        onClick={(event) => {
                          // Find all section divs and hide them
                          const sectionDivs = document.querySelectorAll('[id^="section-"]');
                          sectionDivs.forEach((div) => {
                            div.classList.add('hidden');
                            div.classList.remove('block');
                          });

                          // Show the selected section
                          const selectedSection = document.getElementById(`section-${index}`);
                          if (selectedSection) {
                            selectedSection.classList.remove('hidden');
                            selectedSection.classList.add('block');
                          }

                          // Update active tab
                          const tabs = document.querySelectorAll('.tab');
                          tabs.forEach((tab) => {
                            tab.classList.remove('tab-active');
                          });

                          // Add active class to clicked tab
                          const clickedTab = event.currentTarget;
                          clickedTab.classList.add('tab-active');
                        }}
                      >
                        {section.title}
                      </a>
                    ))}
                  </div>

                  <div className="mt-6">
                    {resume.sections.map((section, index) => (
                      <div
                        key={index}
                        id={`section-${index}`}
                        className={index === 0 ? 'block' : 'hidden'}
                      >
                        <ResumeSection section={section} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print version - all sections visible */}
                <div className="hidden print:block space-y-6">
                  {resume.sections.map((section, index) => (
                    <div key={index}>
                      <ResumeSection section={section} isPrint />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">No resume sections found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
