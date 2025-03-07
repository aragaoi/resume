import React from 'react';
import { Resume as ResumeType } from '../types/Resume';
import { ResumeSection } from './ResumeSection';
import websiteTypes from '../config/website-types.json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings2, Download, Upload, Printer, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="w-4 h-4 mr-2" />
                  Options
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from LinkedIn
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onBack}>
                  <Upload className="w-4 h-4 mr-2" />
                  Change File
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload a different resume file</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Resume
                </Button>
              </TooltipTrigger>
              <TooltipContent>Print or save as PDF</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto mt-16 print:mt-0">
        <Card className="overflow-hidden print:shadow-none">
          {/* Header */}
          <div className="p-8 pb-6 bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20 print:bg-none border-b">
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
            <div className="flex flex-wrap justify-center items-center gap-3">
              {resume.contact.email && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`mailto:${resume.contact.email}`}
                      className="inline-flex items-center px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 
                        rounded-full text-sm text-muted hover:text-primary transition-colors duration-200"
                    >
                      <span className="inline-block w-4 mr-2 print:hidden">✉️</span>
                      {resume.contact.email}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Send email</TooltipContent>
                </Tooltip>
              )}
              {/* Similar tooltips for phone and location */}
              {resume.contact.websites?.map((website, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <a
                      href={website.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 bg-white/50 dark:bg-gray-700/50 
                        rounded-full text-sm text-muted hover:text-primary transition-colors duration-200"
                    >
                      <span className="inline-block w-4 mr-2 print:hidden">
                        {websiteTypes[website.type]?.icon || websiteTypes.other.icon}
                      </span>
                      <span>
                        {website.label ||
                          websiteTypes[website.type]?.label ||
                          websiteTypes.other.label}
                      </span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>Visit {website.type}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Resume Sections */}
          <div className="p-8 space-y-8">
            {resume.sections.map((section, index) => (
              <ResumeSection
                key={index}
                section={section}
                isLast={index === resume.sections.length - 1}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
