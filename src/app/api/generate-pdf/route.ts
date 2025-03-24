import { generateResumePdf } from '../../../lib/pdfGenerator';
import { Resume } from '../../../types/Resume';
import { NextResponse } from 'next/server';

/**
 * API route for generating a PDF from a JSON Resume
 */
export async function POST(request: Request) {
  try {
    console.log('Received request to generate PDF');

    // Get the resume data from the request body
    const resumeData: Resume = await request.json();

    if (!resumeData || !resumeData.name) {
      return NextResponse.json({ error: 'Invalid resume data' }, { status: 400 });
    }

    // Generate the PDF using our library
    const pdfBytes = await generateResumePdf(resumeData);

    // Return the PDF as a blob with inline disposition for viewing in the browser
    return new Response(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
