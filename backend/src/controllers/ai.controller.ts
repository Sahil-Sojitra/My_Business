import { Request, Response } from 'express';
import { PDFDocument } from 'pdf-lib';
import {
  mistralDocumentAIService,
  MistralAIError,
} from '../services/ai/mistralDocumentAI.service.js';

// Constants for PDF validation limits
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ALLOWED_PAGES = 3;

/**
 * Validates raw buffer to ensure it is a valid, unencrypted PDF with <= 3 pages
 */
export async function validatePdfBuffer(buffer: Buffer): Promise<{ pageCount: number }> {
  // 1. Minimum length and magic bytes check (%PDF-)
  if (!buffer || buffer.length < 5) {
    throw new Error('File is empty or too small to be a valid PDF.');
  }

  const magicBytes = buffer.subarray(0, 5).toString('ascii');
  if (magicBytes !== '%PDF-') {
    throw new Error('Uploaded file is not a valid PDF document (magic bytes mismatch).');
  }

  // 2. File size limit
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error(`PDF file size exceeds maximum limit of 10 MB (${(buffer.length / (1024 * 1024)).toFixed(2)} MB received).`);
  }

  // 3. Parse PDF structure and check encryption
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.toLowerCase().includes('encrypted') || msg.toLowerCase().includes('password')) {
      const encryptionErr = new Error('Encrypted or password-protected PDFs are not supported.');
      (encryptionErr as any).statusCode = 400;
      throw encryptionErr;
    }
    const parseErr = new Error('Corrupted or malformed PDF file could not be parsed.');
    (parseErr as any).statusCode = 400;
    throw parseErr;
  }

  // 4. Page count limit
  const pageCount = pdfDoc.getPageCount();
  if (pageCount === 0) {
    throw new Error('PDF file contains no renderable pages.');
  }

  if (pageCount > MAX_ALLOWED_PAGES) {
    const pageErr = new Error(`PDF exceeds maximum allowed page count of ${MAX_ALLOWED_PAGES} pages (document has ${pageCount} pages).`);
    (pageErr as any).statusCode = 400;
    throw pageErr;
  }

  return { pageCount };
}

/**
 * POST /api/v1/ai/test-extraction
 * Testing-only endpoint for diamond & commercial bill extraction using Mistral Document AI.
 * 
 * Strict safety constraints:
 * - Read-only testing evaluation.
 * - Does NOT create or modify bills, companies, or database records.
 * - Validates PDF magic bytes, structure, encryption, and page bounds.
 */
export const testExtraction = async (req: Request, res: Response) => {
  try {
    // 1. Verify user authentication
    if (!req.user?.id) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required to access testing extraction endpoint.',
        statusCode: 401,
      });
    }

    // 2. Extract uploaded file from multer (supports field 'file' or 'pdf')
    let uploadedFile: Express.Multer.File | undefined;

    if (req.file) {
      uploadedFile = req.file;
    } else if (req.files) {
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };
      uploadedFile = filesObj['file']?.[0] || filesObj['pdf']?.[0];
    }

    if (!uploadedFile || !uploadedFile.buffer || uploadedFile.buffer.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No PDF file provided. Please upload a PDF file using multipart/form-data under field "file" or "pdf".',
        statusCode: 400,
      });
    }

    // 3. Deep validation of actual PDF content (magic bytes, size, encryption, pages)
    try {
      await validatePdfBuffer(uploadedFile.buffer);
    } catch (validationErr: any) {
      return res.status(validationErr.statusCode || 400).json({
        error: 'Bad Request',
        message: validationErr.message,
        statusCode: validationErr.statusCode || 400,
      });
    }

    // 4. Process document via isolated Mistral service
    const filename = uploadedFile.originalname || 'document.pdf';
    const result = await mistralDocumentAIService.extractBillFromPdf(uploadedFile.buffer, filename);

    // 5. Return extraction response without modifying any database records
    return res.status(200).json({
      success: true,
      model: result.model,
      pageCount: result.pageCount,
      pages: result.pages,
      extractedData: result.extractedData,
      rawAnnotation: result.rawAnnotation,
      usage: result.usage,
    });
  } catch (err: unknown) {
    if (err instanceof MistralAIError) {
      return res.status(err.statusCode).json({
        error: err.name,
        message: err.message,
        statusCode: err.statusCode,
      });
    }

    console.error('[Mistral Test Extraction Error]', err instanceof Error ? err.message : err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete document extraction evaluation.',
      statusCode: 500,
    });
  }
};
