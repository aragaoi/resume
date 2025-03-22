'use client';

import { useState, ReactNode } from 'react';
import { ResumeData } from '../lib/pdfGenerator';
import { Resume, Website } from '../types/Resume';

interface PdfExportButtonProps {
  contentId: string;
  fileName?: string;
  className?: string;
  children?: ReactNode;
  resumeData?: ResumeData | Resume;
  useLocalApi?: boolean;
}

/**
 * Converts a Resume object to a ResumeData object
 * This is necessary because the Resume type and ResumeData type have different structures
 */
const convertResumeToResumeData = (resume: Resume): ResumeData => {
  // Find experience section
  const experienceSection = resume.sections.find(
    (section) => section.title.toLowerCase() === 'experience'
  );
  const experience = experienceSection?.items.map((item) => ({
    company: item.subtitle || '',
    position: item.title,
    startDate: item.period?.start || '',
    endDate: item.period?.end,
    description: item.description || '',
    achievements: item.details || [],
  }));

  // Find education section
  const educationSection = resume.sections.find(
    (section) => section.title.toLowerCase() === 'education'
  );
  const education = educationSection?.items.map((item) => ({
    institution: item.subtitle || '',
    degree: item.title,
    startDate: item.period?.start || '',
    endDate: item.period?.end,
    description: item.description || '',
  }));

  // Find skills section
  const skillsSection = resume.sections.find((section) => section.title.toLowerCase() === 'skills');
  const skills = skillsSection?.items.map((item) => ({
    category: item.title,
    items: item.tags || [],
  }));

  // Find projects section
  const projectsSection = resume.sections.find(
    (section) => section.title.toLowerCase() === 'projects'
  );
  const projects = projectsSection?.items.map((item) => ({
    name: item.title,
    description: item.description || '',
    technologies: item.tags || [],
    url: item.subtitle, // Assuming project URL is stored in subtitle
  }));

  // Convert websites
  const websites = resume.contact.websites?.map((website: Website) => ({
    name: website.label || website.type,
    url: website.url,
  }));

  return {
    name: resume.name,
    title: resume.title || '',
    contact: {
      email: resume.contact.email || '',
      phone: resume.contact.phone || '',
      location: resume.contact.location || '',
      websites,
    },
    summary: resume.sections.find((section) => section.title.toLowerCase() === 'summary')?.items[0]
      ?.description,
    experience: experience || [],
    education: education || [],
    skills: skills || [],
    projects: projects || [],
  };
};

/**
 * A button component that exports the specified content as a PDF
 * Uses pdf-lib via Firebase Functions for high-quality PDF generation
 * with proper support for modern CSS features
 */
export default function PdfExportButton({
  contentId,
  fileName = 'resume.pdf',
  className = 'btn btn-primary',
  children,
  resumeData: propResumeData,
  useLocalApi = false,
}: PdfExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async () => {
    try {
      setIsExporting(true);

      // Get resume data either from props or by extracting from DOM
      let resumeData: ResumeData;

      if (propResumeData) {
        // Check if it's already in ResumeData format or needs conversion
        if ('sections' in propResumeData) {
          // It's a Resume object, convert it
          resumeData = convertResumeToResumeData(propResumeData as Resume);
        } else {
          // It's already a ResumeData object
          resumeData = propResumeData as ResumeData;
        }
      } else {
        // Extract from DOM as before
        const element = document.getElementById(contentId);
        if (!element) {
          throw new Error(`Element with ID "${contentId}" not found`);
        }
        resumeData = extractResumeData(element);
      }

      // Use either local API or Firebase function
      const functionUrl = useLocalApi
        ? '/api/generate-pdf' // Local Next.js API route
        : 'https://us-central1-resumesmartbuilder.cloudfunctions.net/generateResumePdf'; // Firebase function

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      // Get the PDF as a blob
      const pdfBlob = await response.blob();

      // Create a download link and trigger it
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();

      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Extract resume data from the DOM element
   */
  const extractResumeData = (element: HTMLElement) => {
    // Extract basic information
    const name = element.querySelector('h1')?.textContent || 'Resume';
    const title = element.querySelector('.resume-title')?.textContent || '';

    // Extract contact information
    const email =
      element.querySelector('.contact-email')?.textContent?.replace('Email: ', '') || '';
    const phone =
      element.querySelector('.contact-phone')?.textContent?.replace('Phone: ', '') || '';
    const location =
      element.querySelector('.contact-location')?.textContent?.replace('Location: ', '') || '';

    // Extract websites
    const websiteElements = element.querySelectorAll('.contact-website');
    const websites = Array.from(websiteElements).map((el) => {
      const link = el.querySelector('a');
      return {
        name: link?.textContent || '',
        url: link?.getAttribute('href') || '',
      };
    });

    // Extract summary
    const summary = element.querySelector('.resume-summary')?.textContent || '';

    // Extract experience
    const experienceElements = element.querySelectorAll('.experience-item');
    const experience = Array.from(experienceElements).map((el) => {
      const company = el.querySelector('.company')?.textContent || '';
      const position = el.querySelector('.position')?.textContent || '';
      const dates = el.querySelector('.dates')?.textContent || '';
      const [startDate, endDate] = dates.split(' - ');
      const description = el.querySelector('.description')?.textContent || '';

      // Extract achievements
      const achievementElements = el.querySelectorAll('.achievement');
      const achievements = Array.from(achievementElements).map(
        (achieveEl) => achieveEl.textContent || ''
      );

      return {
        company,
        position,
        startDate,
        endDate: endDate === 'Present' ? undefined : endDate,
        description,
        achievements,
      };
    });

    // Extract education
    const educationElements = element.querySelectorAll('.education-item');
    const education = Array.from(educationElements).map((el) => {
      const institution = el.querySelector('.institution')?.textContent || '';
      const degree = el.querySelector('.degree')?.textContent || '';
      const dates = el.querySelector('.dates')?.textContent || '';
      const [startDate, endDate] = dates.split(' - ');
      const description = el.querySelector('.description')?.textContent || '';

      return {
        institution,
        degree,
        startDate,
        endDate: endDate === 'Present' ? undefined : endDate,
        description,
      };
    });

    // Extract skills
    const skillElements = element.querySelectorAll('.skill-category');
    const skills = Array.from(skillElements).map((el) => {
      const category = el.querySelector('.category')?.textContent?.replace(':', '') || '';
      const skillItems =
        el
          .querySelector('.items')
          ?.textContent?.split(',')
          .map((s) => s.trim()) || [];

      return {
        category,
        items: skillItems,
      };
    });

    // Extract projects
    const projectElements = element.querySelectorAll('.project-item');
    const projects = Array.from(projectElements).map((el) => {
      const name = el.querySelector('.name')?.textContent || '';
      const description = el.querySelector('.description')?.textContent || '';
      const technologies =
        el
          .querySelector('.technologies')
          ?.textContent?.split(',')
          .map((t) => t.trim()) || [];
      const url = el.querySelector('.url a')?.getAttribute('href') || '';

      return {
        name,
        description,
        technologies,
        url,
      };
    });

    return {
      name,
      title,
      contact: {
        email,
        phone,
        location,
        websites,
      },
      summary,
      experience,
      education,
      skills,
      projects,
    };
  };

  return (
    <button
      className={className}
      onClick={exportToPdf}
      disabled={isExporting}
      aria-label="Export to PDF"
    >
      {children || (isExporting ? 'Generating PDF...' : 'Export to PDF')}
    </button>
  );
}
