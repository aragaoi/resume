import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Resume data interface
 */
export interface ResumeData {
  name: string;
  title: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    websites?: Array<{
      url: string;
      name: string;
    }>;
  };
  summary?: string;
  experience?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: Array<{
    category: string;
    items: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }>;
}

/**
 * Generates a PDF resume from provided data
 * @param resumeData The resume data to generate a PDF from
 * @returns A Buffer containing the PDF data
 */
export async function generateResumePdf(resumeData: ResumeData): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Define page dimensions
  const pageWidth = 595.28;
  const pageHeight = 841.89; // A4 size in points
  const margin = 50;
  const minBottomMargin = 70; // Increased bottom margin to ensure better pagination

  // Create the first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = page.getHeight() - margin; // Start from top

  // Helper function to add a new page when needed
  const checkAndAddNewPageIfNeeded = (requiredSpace: number) => {
    // If there's not enough space on the current page, add a new one
    if (currentY - requiredSpace < minBottomMargin) {
      console.log(
        `Adding new page, currentY: ${currentY}, requiredSpace: ${requiredSpace}, minBottomMargin: ${minBottomMargin}`
      );
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = page.getHeight() - margin;
      return true;
    }
    return false;
  };

  // Get common fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper function to add text
  const addText = (
    text: string,
    {
      fontSize = 12,
      font = helveticaFont,
      color = rgb(0, 0, 0),
      y = currentY,
      indent = 0,
      checkNewPage = true,
    } = {}
  ) => {
    // Check if we need a new page (estimate space needed as fontSize + 5)
    if (checkNewPage && y - (fontSize + 5) < minBottomMargin) {
      console.log(
        `Adding new page from addText, y: ${y}, fontSize: ${fontSize}, minBottomMargin: ${minBottomMargin}`
      );
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = page.getHeight() - margin;
    }

    // Don't try to draw text that would be off the page
    if (y < minBottomMargin) {
      console.log(`Text would be off page, skipping: "${text.substring(0, 20)}..."`);
      return currentY;
    }

    // For long texts, we need to measure and potentially break them
    if (text.length > 100) {
      const words = text.split(' ');
      let line = '';
      let lineY = y;

      for (const word of words) {
        const testLine = line + (line ? ' ' : '') + word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > pageWidth - 2 * margin - indent) {
          // This line is too long, add it and start a new one
          page.drawText(line, {
            x: margin + indent,
            y: lineY,
            size: fontSize,
            font,
            color,
          });

          lineY -= fontSize + 2; // Move down for next line

          // Check if we need a new page
          if (lineY < minBottomMargin) {
            console.log(`Adding new page during multi-line text, lineY: ${lineY}`);
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            lineY = page.getHeight() - margin;
          }

          line = word;
        } else {
          line = testLine;
        }
      }

      // Draw the last line
      if (line) {
        page.drawText(line, {
          x: margin + indent,
          y: lineY,
          size: fontSize,
          font,
          color,
        });
      }

      return lineY - fontSize - 5;
    } else {
      // This is a short text, draw it normally
      page.drawText(text, {
        x: margin + indent,
        y,
        size: fontSize,
        font,
        color,
      });
      return y - fontSize - 5; // Return the new Y position
    }
  };

  // Helper function to add a section title
  const addSectionTitle = (title: string) => {
    // For section titles, we need about 40 points of space (title + line + padding)
    // Always start a new section on a new page if we're below 100 points from the bottom
    if (currentY < 100 + minBottomMargin) {
      console.log(`Starting section "${title}" on a new page, currentY too low: ${currentY}`);
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentY = page.getHeight() - margin;
    } else {
      // Otherwise check normally
      checkAndAddNewPageIfNeeded(40);
    }

    currentY = addText(title, {
      fontSize: 14,
      font: helveticaBold,
      y: currentY - 20,
      color: rgb(0.2, 0.2, 0.2),
      checkNewPage: false, // Already checked above
    });

    page.drawLine({
      start: { x: margin, y: currentY + 6 },
      end: { x: page.getWidth() - margin, y: currentY + 6 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    return currentY - 10;
  };

  // Add Name and Title
  currentY = addText(resumeData.name, { fontSize: 24, font: helveticaBold });
  currentY = addText(resumeData.title, { fontSize: 14, color: rgb(0.4, 0.4, 0.4) });

  // Add Contact Information
  if (resumeData.contact) {
    currentY -= 20;
    let contactText = '';

    if (resumeData.contact.email) {
      contactText += `Email: ${resumeData.contact.email}  `;
    }

    if (resumeData.contact.phone) {
      contactText += `Phone: ${resumeData.contact.phone}  `;
    }

    if (resumeData.contact.location) {
      contactText += `Location: ${resumeData.contact.location}`;
    }

    currentY = addText(contactText, { fontSize: 10 });

    if (resumeData.contact.websites && resumeData.contact.websites.length > 0) {
      let websitesText = 'Websites: ';
      resumeData.contact.websites.forEach((website, index) => {
        websitesText += `${website.name} (${website.url})`;
        if (index < resumeData.contact.websites!.length - 1) {
          websitesText += ', ';
        }
      });
      currentY = addText(websitesText, { fontSize: 10 });
    }
  }

  // Add Summary if available
  if (resumeData.summary) {
    currentY = addSectionTitle('SUMMARY');
    currentY = addText(resumeData.summary, { fontSize: 10 });
  }

  // Add Experience section
  if (resumeData.experience && resumeData.experience.length > 0) {
    currentY = addSectionTitle('EXPERIENCE');

    for (const job of resumeData.experience) {
      // Check if we need a new page (estimate space needed for job entry)
      const achievementsSpace = job.achievements ? job.achievements.length * 15 : 0;
      const jobEntrySpace = 70 + achievementsSpace; // Base space for job entry + achievements
      checkAndAddNewPageIfNeeded(jobEntrySpace);

      currentY -= 10;

      // Company and Position
      currentY = addText(`${job.position} at ${job.company}`, {
        fontSize: 12,
        font: helveticaBold,
        checkNewPage: false, // Already checked above
      });

      // Dates
      const dateText = job.endDate
        ? `${job.startDate} - ${job.endDate}`
        : `${job.startDate} - Present`;
      currentY = addText(dateText, {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
        checkNewPage: false, // Already checked above
      });

      // Description
      if (job.description) {
        currentY = addText(job.description, {
          fontSize: 10,
          y: currentY - 5,
          checkNewPage: false, // Already checked above
        });
      }

      // Achievements
      if (job.achievements && job.achievements.length > 0) {
        currentY -= 5;

        // Check if we need a new page for the achievements heading
        if (currentY - 15 < minBottomMargin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = page.getHeight() - margin;
        }

        currentY = addText('Key Achievements:', {
          fontSize: 10,
          font: helveticaBold,
          checkNewPage: false, // Already checked above
        });

        for (const achievement of job.achievements) {
          // Check if we need a new page for each achievement
          if (currentY - 15 < minBottomMargin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = page.getHeight() - margin;
            console.log(`Adding new page for achievement, currentY: ${currentY}`);
          }

          currentY = addText(`• ${achievement}`, {
            fontSize: 10,
            indent: 10,
            y: currentY - 3,
            checkNewPage: false, // Already checked above
          });
        }
      }
    }
  }

  // Add Education section
  if (resumeData.education && resumeData.education.length > 0) {
    currentY = addSectionTitle('EDUCATION');

    for (const edu of resumeData.education) {
      // Check if we need a new page - be more conservative with space estimation
      const entryHeight = 80; // Estimate more height for each education entry
      if (checkAndAddNewPageIfNeeded(entryHeight)) {
        console.log(`Added new page for education entry: ${edu.institution}`);
      }

      currentY -= 10;

      // Institution and Degree
      currentY = addText(edu.institution, {
        fontSize: 12,
        font: helveticaBold,
        checkNewPage: false, // Already checked above
      });
      currentY = addText(edu.degree, {
        fontSize: 11,
        checkNewPage: false, // Already checked above
      });

      // Dates
      const dateText = edu.endDate
        ? `${edu.startDate} - ${edu.endDate}`
        : `${edu.startDate} - Present`;
      currentY = addText(dateText, {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
        checkNewPage: false, // Already checked above
      });

      // Description
      if (edu.description) {
        currentY = addText(edu.description, {
          fontSize: 10,
          y: currentY - 5,
          checkNewPage: false, // Already checked above
        });
      }
    }
  }

  // Add Skills section
  if (resumeData.skills && resumeData.skills.length > 0) {
    currentY = addSectionTitle('SKILLS');

    for (const skillCategory of resumeData.skills) {
      // Check if we need a new page, being more conservative with space estimation
      const skillHeight = 20; // Estimate more height per skill category
      if (checkAndAddNewPageIfNeeded(skillHeight)) {
        console.log(`Added new page for skill category: ${skillCategory.category}`);
      }

      currentY -= 8;
      currentY = addText(`${skillCategory.category}: `, {
        fontSize: 10,
        font: helveticaBold,
        checkNewPage: false, // Already checked above
      });

      // For skills, join with less text to ensure proper text wrapping
      const skillChunks: string[] = [];
      const skillItems = skillCategory.items;

      // Split skills into smaller chunks (maximum 5 skills per line)
      for (let i = 0; i < skillItems.length; i += 5) {
        skillChunks.push(skillItems.slice(i, i + 5).join(', '));
      }

      for (const chunk of skillChunks) {
        if (currentY < minBottomMargin + 15) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = page.getHeight() - margin;
          console.log(`Added new page during skills rendering`);
        }

        currentY = addText(chunk, {
          fontSize: 10,
          indent: skillCategory.category.length * 4 + 15, // Indent after the category
          checkNewPage: false, // Handle manually
        });

        currentY -= 5; // Space between skill lines
      }
    }
  }

  // Add Projects section
  if (resumeData.projects && resumeData.projects.length > 0) {
    currentY = addSectionTitle('PROJECTS');

    for (const project of resumeData.projects) {
      // Check if we need a new page - be more conservative with space estimation
      const projectHeight = 70; // Estimate for project entry
      if (checkAndAddNewPageIfNeeded(projectHeight)) {
        console.log(`Added new page for project: ${project.name}`);
      }

      currentY -= 10;

      let projectHeader = project.name;
      if (project.url) {
        projectHeader += ` (${project.url})`;
      }

      currentY = addText(projectHeader, {
        fontSize: 12,
        font: helveticaBold,
        checkNewPage: false, // Already checked above
      });

      if (project.description) {
        currentY = addText(project.description, {
          fontSize: 10,
          checkNewPage: false, // Already checked above
        });
      }

      if (project.technologies && project.technologies.length > 0) {
        // Check if we need a new page for technologies
        if (currentY < minBottomMargin + 15) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = page.getHeight() - margin;
          console.log(`Added new page for project technologies`);
        }

        const techText = `Technologies: ${project.technologies.join(', ')}`;
        currentY = addText(techText, {
          fontSize: 10,
          color: rgb(0.4, 0.4, 0.4),
          checkNewPage: false, // Already checked above
        });
      }
    }
  }

  // Add page numbers to all pages
  const pageCount = pdfDoc.getPageCount();
  console.log(`Total pages in document: ${pageCount}`);

  if (pageCount > 1) {
    for (let i = 0; i < pageCount; i++) {
      const currentPage = pdfDoc.getPage(i);
      const pageWidth = currentPage.getWidth();
      const pageHeight = currentPage.getHeight();

      // Add page number at the bottom center
      currentPage.drawText(`${i + 1} / ${pageCount}`, {
        x: pageWidth / 2 - 15,
        y: 30,
        size: 10,
        font: helveticaFont,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
  }

  // Generate and return the PDF bytes
  return await pdfDoc.save();
}
