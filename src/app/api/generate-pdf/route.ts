mport { NextRequest, NextResponse } from 'next/server';
import { generateResumePdf, ResumeData } from '../../../lib/pdfGenerator';

/**
 * Local API route for PDF generation
 * This allows testing the PDF generation without deploying to Firebase
 * POST /api/generate-pdf
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the resume data from the request body
    const resumeData: ResumeData = await request.json();

    if (!resumeData || !resumeData.name) {
      return NextResponse.json({ error: 'Invalid resume data' }, { status: 400 });
    }

    // Generate the PDF
    const pdfBytes = await generateResumePdf(resumeData);

    // Create a response with the PDF data
    const response = new NextResponse(pdfBytes);

    // Set appropriate headers for PDF download
    response.headers.set('Content-Type', 'application/pdf');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf"`
    );

    return response;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Error generating PDF' }, { status: 500 });
  }
}
