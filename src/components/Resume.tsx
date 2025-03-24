import React, { useState, useEffect, useRef } from 'react';
import { Resume as ResumeType } from '../types/Resume';
import websiteTypes from '../config/website-types.json';
import {
  Upload,
  FileDown,
  FileText,
  Calendar,
  RefreshCw,
  FilePlus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { ResumeSections } from './ResumeSections';
import { ResumeSection } from './ResumeSection';
import { ThemeSwitcher } from './ThemeSwitcher';
import PdfExportButton from './PdfExportButton';
import { createRoot } from 'react-dom/client';

interface ResumeProps {
  resume: ResumeType;
  onBack: () => void;
  onReset?: () => void;
  sourceFile?: string;
  fileMetadata?: {
    lastModified?: Date;
    fromLocalStorage?: boolean;
  };
  onReload?: () => void;
  originalFileName?: string;
}

export const Resume: React.FC<ResumeProps> = ({
  resume,
  onBack,
  onReset,
  sourceFile,
  fileMetadata,
  onReload,
  originalFileName,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const modalCheckboxRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [exportingPdf, setExportingPdf] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [reloading, setReloading] = useState(false);

  // Debug state changes
  useEffect(() => {
    console.log('Modal state changed:', showResetModal);

    if (showResetModal && modalCheckboxRef.current) {
      modalCheckboxRef.current.checked = true;
    } else if (!showResetModal && modalCheckboxRef.current) {
      modalCheckboxRef.current.checked = false;
    }
  }, [showResetModal]);

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

  // Format date for display
  const formatDate = (date: Date) => {
    // Return MM/DD/YY HH:MM format
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month}/${day}/${year} ${hours}:${minutes}`;
  };

  // Centralized PDF export logic
  const handleExportPdf = () => {
    setExportingPdf(true);
    console.log('Exporting PDF...');

    // Create container for the PDF export button
    const pdfExport = document.createElement('div');
    document.body.appendChild(pdfExport);

    // Use createRoot instead of ReactDOM.render
    const root = createRoot(pdfExport);
    root.render(
      <PdfExportButton
        contentId="resume-content"
        fileName={pdfFileName}
        className="hidden"
        resumeData={resume}
        useLocalApi={true}
      />
    );

    // Trigger a click on the first button inside the container
    setTimeout(() => {
      const button = pdfExport.querySelector('button');
      if (button) {
        button.click();
      }

      // Clean up
      setTimeout(() => {
        root.unmount();
        document.body.removeChild(pdfExport);
        setExportingPdf(false);
      }, 1000);
    }, 100);
  };

  const handleReset = () => {
    console.log('Resetting resume...');
    setResetting(true);
    setShowResetModal(false);
    if (modalCheckboxRef.current) {
      modalCheckboxRef.current.checked = false;
    }
    if (onReset) {
      onReset();
    }
    // Reset state after a short delay to ensure any animations complete
    setTimeout(() => {
      setResetting(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-base-100 py-12 px-4 print:p-0 print:m-0 resume-print-container">
      {/* DaisyUI Modal */}
      <input
        type="checkbox"
        id="reset-modal"
        className="modal-toggle"
        ref={modalCheckboxRef}
        checked={showResetModal}
        onChange={(e) => setShowResetModal(e.target.checked)}
      />
      <div className="modal modal-bottom sm:modal-middle" role="dialog">
        <div className="modal-box relative">
          <h3 className="font-bold text-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-warning mr-2" />
            Reset Resume
          </h3>
          <p className="py-4">
            This will reset all changes and load the default resume template. All current content
            will be lost. If you want to keep your current resume, please export it as PDF first.
          </p>
          <div className="modal-action flex justify-between items-center w-full flex-wrap">
            <button
              className="btn btn-primary"
              onClick={() => {
                console.log('Exporting PDF from modal...');
                handleExportPdf();
              }}
              disabled={exportingPdf}
            >
              {exportingPdf ? (
                <span className="loading loading-spinner loading-xs mr-1"></span>
              ) : (
                <FileDown className="w-4 h-4 mr-1" />
              )}
              Export PDF First
            </button>

            <div className="flex gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  console.log('Canceling reset');
                  setShowResetModal(false);
                  if (modalCheckboxRef.current) {
                    modalCheckboxRef.current.checked = false;
                  }
                }}
                disabled={resetting}
              >
                Cancel
              </button>
              <button
                className="btn btn-link text-error"
                onClick={() => {
                  console.log('Confirming reset');
                  handleReset();
                }}
                disabled={resetting || exportingPdf}
              >
                {resetting ? (
                  <span className="loading loading-spinner loading-xs mr-1"></span>
                ) : null}
                Reset
              </button>
            </div>
          </div>
        </div>
        <div
          className="modal-backdrop"
          onClick={() => {
            console.log('Backdrop clicked');
            setShowResetModal(false);
            if (modalCheckboxRef.current) {
              modalCheckboxRef.current.checked = false;
            }
          }}
        ></div>
      </div>

      {/* Navigation Bar - This will be hidden when printing */}
      <div className="navbar bg-base-100 fixed top-0 left-0 right-0 z-50 shadow-sm print:hidden max-w-full px-3 md:px-6">
        <div className="navbar-start flex-none md:w-1/4">
          <a className="btn btn-ghost text-xl truncate max-w-[220px]">Resume Builder</a>
        </div>

        <div className="navbar-end flex flex-wrap justify-end items-center gap-2 overflow-visible flex-1 min-w-0">
          {sourceFile && (
            <div className="bg-base-100 h-8 px-2 max-w-[260px] flex-shrink-0 rounded-md border border-base-200 flex items-center overflow-hidden">
              <FileText className="w-4 h-4 text-primary flex-shrink-0 mr-1.5" />
              <div className="flex-1 min-w-0 flex items-center">
                <div className="flex-col min-w-0">
                  <div className="flex items-baseline">
                    <span className="text-[10px] uppercase tracking-wide text-base-content/50 mr-1 whitespace-nowrap">
                      Source
                    </span>
                    <span className="text-sm font-medium truncate text-base-content flex items-center">
                      <span className="truncate">{sourceFile}</span>
                      {fileMetadata?.fromLocalStorage && (
                        <span className="ml-1 inline-flex items-center text-[10px] text-base-100 bg-primary/80 rounded-sm px-1.5 py-0.5 leading-none tracking-tight whitespace-nowrap flex-shrink-0 align-middle">
                          Saved
                        </span>
                      )}
                    </span>
                  </div>
                  {fileMetadata?.lastModified && (
                    <div className="flex items-center text-[9px] text-base-content/50 leading-none">
                      <Calendar className="w-2 h-2 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {fileMetadata.fromLocalStorage ? 'Last saved: ' : 'Last uploaded: '}
                        {formatDate(fileMetadata.lastModified)}
                      </span>
                    </div>
                  )}
                </div>

                {onReload && sourceFile !== 'Example Resume' && (
                  <button
                    className="btn bg-base-300 flex items-center justify-center rounded-md h-6 w-6 min-h-0 ml-1.5 p-0 hover:bg-primary hover:text-primary-content flex-shrink-0"
                    onClick={(e) => {
                      console.log('Reload clicked', originalFileName);
                      e.stopPropagation();
                      setReloading(true);
                      if (onReload) {
                        onReload();
                      }
                      setTimeout(() => setReloading(false), 500);
                    }}
                    title={originalFileName ? `Reload ${originalFileName}` : 'Reload file'}
                    aria-label="Reload file"
                    disabled={reloading}
                  >
                    {reloading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <RefreshCw className="h-4 w-4 text-primary" strokeWidth={2} />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <button className="btn btn-ghost btn-sm flex-shrink-0" onClick={onBack}>
            <Upload className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Upload Resume</span>
          </button>

          <button
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? (
              <span className="loading loading-spinner loading-xs mr-1"></span>
            ) : (
              <FileDown className="w-4 h-4 mr-1" />
            )}
            <span className="hidden sm:inline">Export</span>
            <span className="badge badge-xs badge-ghost text-primary ml-1">PDF</span>
          </button>

          {onReset && (
            <button
              className="btn btn-ghost btn-sm flex-shrink-0"
              onClick={() => {
                console.log('Opening reset modal');
                setShowResetModal(true);
              }}
              title="Reset to default resume template"
              disabled={resetting}
            >
              {resetting ? (
                <span className="loading loading-spinner loading-xs mr-1"></span>
              ) : (
                <Trash2 className="w-4 h-4 mr-1 text-error" />
              )}
              <span className="hidden sm:inline">Reset Resume</span>
            </button>
          )}

          <ThemeSwitcher className="flex-shrink-0" />
        </div>
      </div>

      {/* Hidden component for PDF export */}
      <div className="hidden">
        <PdfExportButton
          contentId="resume-content"
          fileName={pdfFileName}
          className="hidden"
          resumeData={resume}
          useLocalApi={true}
        />
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
