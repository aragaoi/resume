import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Resume, ResumeSection } from '../types/Resume';

/**
 * Enum for section types to determine rendering approach
 */
enum SectionType {
  SUMMARY = 'summary',
  TIMELINE = 'timeline', // Experience, Education, Certificates, etc.
  SKILLS = 'skills',
  LIST = 'list',
}

/**
 * Generates a PDF resume from provided data
 * @param resume The resume data to generate a PDF from
 * @returns A Buffer containing the PDF data
 */
export async function generateResumePdf(resume: Resume): Promise<Uint8Array> {
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
  currentY = addText(resume.name, { fontSize: 24, font: helveticaBold });
  if (resume.title) {
    currentY = addText(resume.title, { fontSize: 14, color: rgb(0.4, 0.4, 0.4) });
  }

  // Add Contact Information
  if (resume.contact) {
    currentY -= 20;
    let contactText = '';

    if (resume.contact.email) {
      contactText += `Email: ${resume.contact.email}  `;
    }

    if (resume.contact.phone) {
      contactText += `Phone: ${resume.contact.phone}  `;
    }

    if (resume.contact.location) {
      contactText += `Location: ${resume.contact.location}`;
    }

    currentY = addText(contactText, { fontSize: 10 });

    if (resume.contact.websites && resume.contact.websites.length > 0) {
      let websitesText = 'Websites: ';
      resume.contact.websites.forEach((website, index) => {
        websitesText += `${website.label || website.type} (${website.url})`;
        if (index < resume.contact.websites!.length - 1) {
          websitesText += ', ';
        }
      });
      currentY = addText(websitesText, { fontSize: 10 });
    }
  }

  // Determine section type based on content structure and title
  const getSectionType = (section: ResumeSection): SectionType => {
    const title = section.title.toLowerCase();

    // Summary is a special case with different structure
    if (title === 'summary') {
      return SectionType.SUMMARY;
    }

    // Skills typically have nested items or content lists
    if (title === 'skills') {
      return SectionType.SKILLS;
    }

    // Check if section has timeline-like items (with dates/periods)
    if (section.items?.some((item) => item.period)) {
      return SectionType.TIMELINE;
    }

    // Default to list type for anything else
    return SectionType.LIST;
  };

  // Render summary section (single paragraph)
  const renderSummarySection = (section: ResumeSection) => {
    currentY = addSectionTitle(section.title.toUpperCase());

    if (section.items && section.items.length > 0 && section.items[0].description) {
      currentY = addText(section.items[0].description, { fontSize: 10 });
    }
  };

  // Render timeline section (experience, education, certificates, etc.)
  const renderTimelineSection = (section: ResumeSection) => {
    currentY = addSectionTitle(section.title.toUpperCase());

    if (!section.items || section.items.length === 0) {
      currentY = addText('No items in this section', {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      return;
    }

    for (const item of section.items) {
      // Calculate required space
      const contentSpace = item.content ? item.content.length * 15 : 0;
      const itemSpace = 70 + contentSpace; // Base space + content
      checkAndAddNewPageIfNeeded(itemSpace);

      currentY -= 10;

      // Get the date text first to determine the layout
      let dateText = '';
      let isSingleDateItem = false;

      if (item.period) {
        // Check if this is a single-date item (start and end dates are the same)
        isSingleDateItem = item.period.start === item.period.end;

        // For single date items (like certifications), just show the start date
        if (isSingleDateItem) {
          dateText = item.period.start;
        } else {
          // For date ranges (like jobs and education), use the full date range
          dateText = item.period.end
            ? `${item.period.start} - ${item.period.end}`
            : `${item.period.start} - Present`;
        }
      }

      // Special handling for items with single dates (like certifications)
      if (isSingleDateItem && dateText) {
        // Draw the year first
        currentY = addText(dateText, {
          fontSize: 10,
          color: rgb(0.4, 0.4, 0.4),
          checkNewPage: false,
        });

        // Add spacing after the year
        currentY -= 5;
      }

      // Title and subtitle
      let titleText = item.title;
      if (item.subtitle) {
        if (section.title.toLowerCase() === 'experience') {
          titleText += ` at ${item.subtitle}`;
        } else {
          currentY = addText(item.title, {
            fontSize: 12,
            font: helveticaBold,
            checkNewPage: false,
          });

          // Add subtitle with extra spacing
          currentY = addText(item.subtitle, {
            fontSize: 11,
            y: currentY - 5, // Add extra spacing before subtitle
            checkNewPage: false,
          });

          // Add extra spacing after subtitle
          currentY -= 5;
        }
      }

      // If we didn't render separately above
      if (!item.subtitle || section.title.toLowerCase() === 'experience') {
        currentY = addText(titleText, {
          fontSize: 12,
          font: helveticaBold,
          checkNewPage: false,
        });
      }

      // Dates - Only show dates here if not already shown for single-date items
      if (dateText && !isSingleDateItem) {
        currentY = addText(dateText, {
          fontSize: 10,
          color: rgb(0.4, 0.4, 0.4),
          checkNewPage: false,
        });
      }

      // Description
      if (item.description) {
        currentY = addText(item.description, {
          fontSize: 10,
          y: currentY - 5,
          checkNewPage: false,
        });
      }

      // Content/bullet points
      if (item.content && item.content.length > 0) {
        currentY -= 5;
        for (const contentItem of item.content) {
          // Check if we need a new page for each content item
          if (currentY - 15 < minBottomMargin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = page.getHeight() - margin;
          }

          currentY = addText(`• ${contentItem}`, {
            fontSize: 10,
            indent: 10,
            y: currentY - 3,
            checkNewPage: false,
          });
        }
      }
    }
  };

  // Render skills section (categories and lists)
  const renderSkillsSection = (section: ResumeSection) => {
    currentY = addSectionTitle(section.title.toUpperCase());

    if (!section.items || section.items.length === 0) {
      currentY = addText('No skills listed', {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      return;
    }

    // Process each skill category
    for (let i = 0; i < section.items.length; i++) {
      const skillCategory = section.items[i];

      // Check if we need a new page
      const isFirstSkill = i === 0;
      const skillHeight = isFirstSkill ? 40 : 20;

      if (currentY < skillHeight + minBottomMargin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = page.getHeight() - margin;
      }

      currentY -= 15;

      // Draw category name
      currentY = addText(`${skillCategory.title}:`, {
        fontSize: 12,
        font: helveticaBold,
        checkNewPage: false,
      });

      // Get skills from content
      let skillItems: string[] = [];
      if (skillCategory.content && skillCategory.content.length > 0) {
        skillItems = skillCategory.content.filter(Boolean);
      }

      // Render skills in chunks
      if (skillItems.length > 0) {
        const skillChunks: string[] = [];

        // Split into chunks of 4 skills per line
        for (let i = 0; i < skillItems.length; i += 4) {
          skillChunks.push(skillItems.slice(i, i + 4).join(', '));
        }

        const indent = 15;

        for (const chunk of skillChunks) {
          if (currentY < minBottomMargin + 20) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = page.getHeight() - margin;
          }

          currentY = addText(`• ${chunk}`, {
            fontSize: 10,
            indent: indent,
            checkNewPage: false,
          });

          currentY -= 5;
        }
      }

      // Extra space after category
      currentY -= 5;
    }
  };

  // Render list section (projects, etc.)
  const renderListSection = (section: ResumeSection) => {
    currentY = addSectionTitle(section.title.toUpperCase());

    if (!section.items || section.items.length === 0) {
      currentY = addText('No items in this section', {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      return;
    }

    for (const item of section.items) {
      // Check if we need a new page
      const itemHeight = 70;
      if (checkAndAddNewPageIfNeeded(itemHeight)) {
        console.log(`Added new page for item: ${item.title}`);
      }

      currentY -= 10;

      // Item title and subtitle
      let itemHeader = item.title;
      if (item.subtitle) {
        // Display title and subtitle separately with extra spacing
        currentY = addText(item.title, {
          fontSize: 12,
          font: helveticaBold,
          checkNewPage: false,
        });

        // Add subtitle with extra spacing
        currentY = addText(item.subtitle, {
          fontSize: 11,
          y: currentY - 5, // Add extra spacing before subtitle
          checkNewPage: false,
        });

        // Add extra spacing after subtitle
        currentY -= 5;
      } else {
        // Just display the title
        currentY = addText(itemHeader, {
          fontSize: 12,
          font: helveticaBold,
          checkNewPage: false,
        });
      }

      // Description
      if (item.description) {
        currentY = addText(item.description, {
          fontSize: 10,
          checkNewPage: false,
        });
      }

      // Content/bullet points
      if (item.content && item.content.length > 0) {
        currentY -= 5;
        for (const contentItem of item.content) {
          if (currentY - 15 < minBottomMargin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = page.getHeight() - margin;
          }

          currentY = addText(`• ${contentItem}`, {
            fontSize: 10,
            indent: 10,
            y: currentY - 3,
            checkNewPage: false,
          });
        }
      }

      // Tags
      if (item.tags && item.tags.length > 0) {
        if (currentY < minBottomMargin + 15) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = page.getHeight() - margin;
        }

        const techText = `Technologies: ${item.tags.join(', ')}`;
        currentY = addText(techText, {
          fontSize: 10,
          color: rgb(0.4, 0.4, 0.4),
          checkNewPage: false,
        });
      }
    }
  };

  // Process all sections in the resume
  for (const section of resume.sections) {
    // Determine the section type based on content
    const sectionType = getSectionType(section);

    // Render section based on its type
    switch (sectionType) {
      case SectionType.SUMMARY:
        renderSummarySection(section);
        break;
      case SectionType.TIMELINE:
        renderTimelineSection(section);
        break;
      case SectionType.SKILLS:
        renderSkillsSection(section);
        break;
      case SectionType.LIST:
        renderListSection(section);
        break;
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
