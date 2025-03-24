'use client';

import { useState, ReactNode } from 'react';
import { Resume } from '../types/Resume';

interface PdfExportButtonProps {
  contentId: string;
  fileName?: string;
  className?: string;
  children?: ReactNode;
  resumeData?: Resume;
  useLocalApi?: boolean;
}

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

      // Get resume data from props
      if (!propResumeData) {
        throw new Error('No resume data provided');
      }

      // Make a deep copy to avoid modifying the original data
      const resumeData = JSON.parse(JSON.stringify(propResumeData));

      // Log the structure of each section to help with debugging
      console.log('Resume structure being sent to PDF generator:');
      resumeData.sections.forEach((section: any) => {
        console.log(`Section: ${section.title}, Items: ${section.items.length}`);
        if (section.title.toLowerCase() === 'skills') {
          section.items.forEach((item: any, index: number) => {
            const hasDetails = item.details?.length > 0;
            console.log(`  Skill ${index}: ${item.title}, hasDetails: ${hasDetails}`);

            if (hasDetails) {
              console.log(
                `    Details items (first 3): ${item.details.slice(0, 3).join(', ')}${
                  item.details.length > 3 ? '...' : ''
                }`
              );
            }
          });
        }
      });

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
