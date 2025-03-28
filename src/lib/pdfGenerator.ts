import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Resume, ResumeItem, ResumeSection } from '../types/Resume';

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
 * Spacing constants for consistent layout
 */
const SPACING = {
  // Spacing before section title (for non-first sections)
  SECTION_TITLE_BEFORE: 10,
  // Additional spacing for non-first sections
  SECTION_TITLE_BEFORE_EXTRA: 12,
  // Spacing between section title text and underline
  SECTION_TITLE_UNDERLINE: 8,
  // Spacing after section title underline
  SECTION_TITLE_AFTER: 15,
  // Spacing after item title
  ITEM_TITLE_AFTER: 16,
  // Spacing after subtitle
  SUBTITLE_AFTER: 16,
  // Spacing after date/period text
  DATE_AFTER: 15,
  // Spacing after item description
  DESCRIPTION_AFTER: 10,
  // Spacing before bullet points
  BULLET_BEFORE: 3,
  // Spacing after each bullet point
  BULLET_AFTER: 3,
  // Standard spacing between items
  ITEM_SPACING: 12,
};

/**
 * Generates a PDF resume from provided data
 * @param resume The resume data to generate a PDF from
 * @returns A Buffer containing the PDF data
 */
export async function generateResumePdf(resume: Resume): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

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
  const addSectionTitle = (title: string, isFirstSection: boolean = false) => {
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

    // Add extra space before the section title if it's not the first section
    if (!isFirstSection) {
      currentY -= SPACING.SECTION_TITLE_BEFORE + SPACING.SECTION_TITLE_BEFORE_EXTRA;
    } else {
      // Add standard space before first section title
      currentY -= SPACING.SECTION_TITLE_BEFORE;
    }

    // Draw the title with bold font
    page.drawText(title.toUpperCase(), {
      x: margin,
      y: currentY,
      size: 14,
      font: helveticaBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Draw a horizontal line under the section title
    currentY -= SPACING.SECTION_TITLE_UNDERLINE;
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: pageWidth - margin, y: currentY },
      thickness: 0.75,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Consistent spacing after the section title line for all sections
    currentY -= SPACING.SECTION_TITLE_AFTER;

    return currentY;
  };

  // Add Name
  page.drawText(resume.name, {
    x: margin,
    y: currentY,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  currentY -= 20; // Reduced from 30

  // Add Title with slightly smaller font
  if (resume.title) {
    page.drawText(resume.title, {
      x: margin,
      y: currentY,
      size: 16,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 15; // Reduced from 25
  }

  // Draw a horizontal line to separate the header from contact info
  page.drawLine({
    start: { x: margin, y: currentY + 10 },
    end: { x: pageWidth - margin, y: currentY + 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  currentY -= 15; // Reduced from 25

  // Add Contact Information
  if (resume.contact) {
    // Two-column layout for contact information
    const leftColumnX = margin;
    const rightColumnX = margin + 250; // Adjust based on page width
    let leftColumnY = currentY;
    let rightColumnY = currentY;

    // Left column: Email and Phone
    if (resume.contact.email) {
      // Draw the label in bold
      page.drawText('Email:', {
        x: leftColumnX,
        y: leftColumnY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Draw the value with regular font, indented
      page.drawText(resume.contact.email, {
        x: leftColumnX + 50,
        y: leftColumnY,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      leftColumnY -= 15; // Reduced from 18 - Space between lines
    }

    if (resume.contact.phone) {
      // Draw the label in bold
      page.drawText('Phone:', {
        x: leftColumnX,
        y: leftColumnY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Draw the value with regular font, indented
      page.drawText(resume.contact.phone, {
        x: leftColumnX + 50,
        y: leftColumnY,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      leftColumnY -= 15; // Reduced from 18
    }

    // Right column: Location and Websites
    if (resume.contact.location) {
      // Draw the label in bold
      page.drawText('Location:', {
        x: rightColumnX,
        y: rightColumnY,
        size: 11,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      // Draw the value with regular font, indented
      page.drawText(resume.contact.location, {
        x: rightColumnX + 65,
        y: rightColumnY,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      rightColumnY -= 15; // Reduced from 18
    }

    // Add websites to the appropriate column (whichever has more space)
    if (resume.contact.websites && resume.contact.websites.length > 0) {
      for (const website of resume.contact.websites) {
        const label = website.label || website.type.charAt(0).toUpperCase() + website.type.slice(1);

        // Choose the column with more space
        if (leftColumnY > rightColumnY) {
          // Draw the label in bold
          page.drawText(`${label}:`, {
            x: leftColumnX,
            y: leftColumnY,
            size: 11,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2),
          });

          // Draw the value with regular font, indented
          // Adjust indent based on label length
          const indent = Math.max(label.length * 6, 50);
          page.drawText(website.url, {
            x: leftColumnX + indent,
            y: leftColumnY,
            size: 11,
            font: helveticaFont,
            color: rgb(0.1, 0.3, 0.8), // Blue color for links
          });
          leftColumnY -= 15; // Reduced from 18
        } else {
          // Draw the label in bold
          page.drawText(`${label}:`, {
            x: rightColumnX,
            y: rightColumnY,
            size: 11,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2),
          });

          // Draw the value with regular font, indented
          // Adjust indent based on label length
          const indent = Math.max(label.length * 6, 65);
          page.drawText(website.url, {
            x: rightColumnX + indent,
            y: rightColumnY,
            size: 11,
            font: helveticaFont,
            color: rgb(0.1, 0.3, 0.8), // Blue color for links
          });
          rightColumnY -= 15; // Reduced from 18
        }
      }
    }

    // Set currentY to the lower of the two columns
    currentY = Math.min(leftColumnY, rightColumnY) - 5; // Reduced from 10
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

    // We no longer need a special check for certifications by title
    // Any section with items that have dates will be treated as TIMELINE

    // Check if section has timeline-like items (with dates/periods)
    if (section.items?.some((item) => item.period)) {
      return SectionType.TIMELINE;
    }

    // Default to list type for anything else
    return SectionType.LIST;
  };

  // Render summary section (single paragraph)
  const renderSummarySection = (section: ResumeSection, isFirstSection: boolean) => {
    currentY = addSectionTitle(section.title.toUpperCase(), isFirstSection);

    // Check if we have items to render
    if (section.items && section.items.length > 0) {
      const item = section.items[0];

      // If there's a description, render it
      if (item.description) {
        currentY = addText(item.description, { fontSize: 10 });
        // Add some spacing if we also have content
        if (item.content && item.content.length > 0) {
          currentY -= 10;
        }
      }

      // If there's content, render each content item as paragraph text (not bullets)
      if (item.content && item.content.length > 0) {
        for (let i = 0; i < item.content.length; i++) {
          const contentItem = item.content[i];
          // Add text without indentation
          currentY = addText(contentItem, {
            fontSize: 10,
            indent: 0,
          });

          // Add spacing between paragraphs but not after the last one
          if (i < item.content.length - 1) {
            currentY -= 5;
          }
        }
      }
    }
  };

  // Helper function to render a timeline section (like education or experience)
  const renderTimelineSection = (section: ResumeSection, isFirstSection: boolean) => {
    if (!section.items || section.items.length === 0) return;

    currentY = addSectionTitle(section.title, isFirstSection);

    // First item starts directly after the standard section spacing
    // No need to add extra spacing here

    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const isLastItem = i === section.items.length - 1;

      checkAndAddNewPageIfNeeded(60); // Check if we need a new page for this item

      // Item title (e.g., Company name or University)
      page.drawText(item.title, {
        x: margin,
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      currentY -= SPACING.ITEM_TITLE_AFTER;

      // Extra spacing for subtitle
      if (item.subtitle) {
        // Item subtitle (e.g., Department or Degree)
        page.drawText(item.subtitle, {
          x: margin,
          y: currentY,
          size: 11,
          font: helveticaFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= SPACING.SUBTITLE_AFTER;
      }

      // Create a separate line for location and date
      let locationDateText = '';

      if (item.period) {
        // Deep debugging for certification dates
        console.log('==========================================');
        console.log(`PERIOD DEBUG for item: "${item.title}" in section: "${section.title}"`);
        console.log('Raw period object:', JSON.stringify(item.period));
        console.log('Period start type:', typeof item.period.start);
        console.log('Period end type:', typeof item.period.end);
        console.log('Period end value:', item.period.end);
        console.log('Period start === end:', item.period.start === item.period.end);

        // Make the comparison more robust by trimming and normalizing date strings
        const startDate = item.period.start?.trim();
        const endDate = item.period.end?.trim();

        console.log('After trim - startDate:', startDate);
        console.log('After trim - endDate:', endDate);
        console.log('After trim - startDate === endDate:', startDate === endDate);

        // For normalized dates where end === start, only show the start date
        // This happens for certifications and other single-date items
        if (endDate && startDate === endDate) {
          locationDateText = startDate;
          console.log('DECISION: Using only start date (exact match)');
        }
        // For "Present" dates (from markdown parser without normalization)
        else if (endDate === 'Present') {
          locationDateText = `${startDate} - Present`;
          console.log('DECISION: Using start date with Present');
        }
        // For undefined end date (should be rare after normalization)
        else if (!endDate) {
          locationDateText = `${startDate} - Present`;
          console.log('DECISION: Using start date with Present (undefined end)');
        }
        // For actual date ranges with different start and end dates
        else {
          locationDateText = `${startDate} - ${endDate}`;
          console.log('DECISION: Using full date range');
        }

        console.log('Final locationDateText:', locationDateText);
        console.log('==========================================');
      }

      if (locationDateText) {
        page.drawText(locationDateText, {
          x: margin,
          y: currentY,
          size: 10,
          font: helveticaOblique,
          color: rgb(0.4, 0.4, 0.4),
        });
        currentY -= SPACING.DATE_AFTER;
      }

      // Item description
      if (item.description) {
        currentY = addText(item.description, {
          fontSize: 11,
          y: currentY,
        });
      }

      // Item content (bullet points)
      if (item.content && item.content.length > 0) {
        for (const contentItem of item.content) {
          currentY = addText(`- ${contentItem}`, {
            fontSize: 10,
            indent: 10,
            y: currentY - SPACING.BULLET_BEFORE,
          });
        }
      }

      // Only add spacing between items, not after the last item
      if (!isLastItem) {
        // Add standardized spacing between items
        currentY -= SPACING.ITEM_SPACING;
      }
    }
  };

  // Render skills section (categories and lists)
  const renderSkillsSection = (section: ResumeSection, isFirstSection: boolean) => {
    currentY = addSectionTitle(section.title.toUpperCase(), isFirstSection);

    if (!section.items || section.items.length === 0) {
      currentY = addText('No skills listed', {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      return;
    }

    // Process each skill category - no additional spacing needed here
    for (let i = 0; i < section.items.length; i++) {
      const skillCategory = section.items[i];
      const isLastCategory = i === section.items.length - 1;

      // Check if we need a new page
      const isFirstSkill = i === 0;
      const skillHeight = isFirstSkill ? 40 : 20;

      if (currentY < skillHeight + minBottomMargin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = page.getHeight() - margin;
      }

      // Draw category name directly, without additional spacing
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

          currentY = addText(`- ${chunk}`, {
            fontSize: 10,
            indent: indent,
            checkNewPage: false,
          });

          currentY -= SPACING.BULLET_AFTER;
        }
      }

      // Only add standard spacing between skill categories, not after the last one
      if (!isLastCategory) {
        currentY -= SPACING.ITEM_SPACING;
      }
    }
  };

  // Render list section (projects, etc.)
  const renderListSection = (section: ResumeSection, isFirstSection: boolean) => {
    currentY = addSectionTitle(section.title.toUpperCase(), isFirstSection);

    if (!section.items || section.items.length === 0) {
      currentY = addText('No items in this section', {
        fontSize: 10,
        color: rgb(0.4, 0.4, 0.4),
      });
      return;
    }

    // No extra spacing needed here
    for (let i = 0; i < section.items.length; i++) {
      const item = section.items[i];
      const isLastItem = i === section.items.length - 1;

      // Check if we need a new page
      const itemHeight = 70;
      if (checkAndAddNewPageIfNeeded(itemHeight)) {
        console.log(`Added new page for item: ${item.title}`);
      }

      // Item title and subtitle
      let itemHeader = item.title;
      if (item.subtitle) {
        // Display title and subtitle separately with extra spacing
        currentY = addText(item.title, {
          fontSize: 12,
          font: helveticaBold,
          checkNewPage: false,
        });

        // Add subtitle with consistent spacing
        currentY = addText(item.subtitle, {
          fontSize: 11,
          y: currentY - SPACING.BULLET_BEFORE,
          checkNewPage: false,
        });
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
        currentY -= SPACING.BULLET_BEFORE;
        for (const contentItem of item.content) {
          if (currentY - 15 < minBottomMargin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = page.getHeight() - margin;
          }

          currentY = addText(`- ${contentItem}`, {
            fontSize: 10,
            indent: 10,
            y: currentY - SPACING.BULLET_BEFORE,
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

      // Only add spacing between items, not after the last item
      if (!isLastItem) {
        // Add standardized spacing between items
        currentY -= SPACING.ITEM_SPACING;
      }
    }
  };

  // Process all sections in the resume
  for (let i = 0; i < resume.sections.length; i++) {
    const section = resume.sections[i];
    const isFirstSection = i === 0;

    // Determine the section type based on content
    const sectionType = getSectionType(section);

    // Render section based on its type
    switch (sectionType) {
      case SectionType.SUMMARY:
        renderSummarySection(section, isFirstSection);
        break;
      case SectionType.TIMELINE:
        renderTimelineSection(section, isFirstSection);
        break;
      case SectionType.SKILLS:
        renderSkillsSection(section, isFirstSection);
        break;
      case SectionType.LIST:
        renderListSection(section, isFirstSection);
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
