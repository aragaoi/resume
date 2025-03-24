/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import cors from 'cors';
import { Resume } from '../../src/types/Resume';

// Configure CORS middleware
const corsHandler = cors({ origin: true });

/**
 * Generates a PDF resume from provided data
 */
export const generateResumePdf = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    try {
      // Only accept POST requests
      if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
      }

      // Parse the resume data from the request body
      const resumeData: Resume = request.body;
      if (!resumeData || !resumeData.name) {
        response.status(400).send('Invalid resume data');
        return;
      }

      // Import the shared PDF generator dynamically
      // We need to use dynamic import to avoid bundling issues with pdf-lib in the cloud function
      // Note: In production, you would need to set up proper build steps to include the shared module
      // This is just for demonstration purposes
      const pdfGenerator = require('../../../src/lib/pdfGenerator');

      // Generate the PDF
      const pdfBytes = await pdfGenerator.generateResumePdf(resumeData);

      // Set appropriate headers for PDF viewing in the browser
      response.setHeader('Content-Type', 'application/pdf');
      response.setHeader(
        'Content-Disposition',
        `inline; filename="${resumeData.name.replace(/\s+/g, '_')}_Resume.pdf"`
      );

      // Send the PDF bytes
      response.status(200).send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error('Error generating PDF:', error);
      response.status(500).send('Error generating PDF');
    }
  });
});
