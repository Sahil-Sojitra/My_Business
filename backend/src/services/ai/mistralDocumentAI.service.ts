import type { Mistral } from '@mistralai/mistralai' with { 'resolution-mode': 'import' };
import {
  BILL_EXTRACTION_JSON_SCHEMA,
  BILL_EXTRACTION_PROMPT,
  ExtractedBill,
  extractedBillSchema,
} from '../../schemas/aiExtraction.schema.js';

/**
 * Custom error hierarchy for Mistral Document AI
 */
export class MistralAIError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'MISTRAL_ERROR') {
    super(message);
    this.name = 'MistralAIError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class MistralConfigError extends MistralAIError {
  constructor(message: string = 'Mistral API key is not configured. Please set MISTRAL_API_KEY.') {
    super(message, 500, 'MISTRAL_CONFIG_MISSING');
    this.name = 'MistralConfigError';
  }
}

export class MistralAuthError extends MistralAIError {
  constructor(message: string = 'Mistral authentication failed. Please verify provider credentials.') {
    super(message, 401, 'MISTRAL_AUTH_FAILED');
    this.name = 'MistralAuthError';
  }
}

export class MistralRateLimitError extends MistralAIError {
  constructor(message: string = 'Mistral API rate limit exceeded or credit quota exhausted.') {
    super(message, 429, 'MISTRAL_RATE_LIMIT');
    this.name = 'MistralRateLimitError';
  }
}

export class MistralTimeoutError extends MistralAIError {
  constructor(message: string = 'Mistral OCR processing timed out. Please try again later.') {
    super(message, 504, 'MISTRAL_TIMEOUT');
    this.name = 'MistralTimeoutError';
  }
}

export class MistralUpstreamError extends MistralAIError {
  constructor(message: string = 'Mistral OCR service encountered an upstream processing error.') {
    super(message, 502, 'MISTRAL_UPSTREAM_ERROR');
    this.name = 'MistralUpstreamError';
  }
}

export interface MistralExtractionResult {
  model: string;
  pageCount: number;
  pages: Array<{
    index: number;
    markdown: string;
  }>;
  extractedData: ExtractedBill | null;
  rawAnnotation: string | null;
  usage: {
    pagesProcessed: number;
    docSizeBytes?: number | null;
  };
}

/**
 * Service encapsulating Mistral Document AI OCR processing
 * strictly isolated from persistent database models.
 */
export class MistralDocumentAIService {
  private clientOverride?: Mistral;

  constructor(clientOverride?: Mistral) {
    this.clientOverride = clientOverride;
  }

  /**
   * Retrieves configured API key from environment
   */
  private getApiKey(): string {
    const key = process.env.MISTRAL_API_KEY || process.env.MISTRAL_API;
    if (!key || !key.trim()) {
      throw new MistralConfigError();
    }
    return key.trim();
  }

  /**
   * Retrieves target OCR model name
   */
  private getModelName(): string {
    return process.env.MISTRAL_OCR_MODEL?.trim() || 'mistral-ocr-latest';
  }

  /**
   * Creates or returns Mistral SDK client instance
   */
  private async getClient(): Promise<Mistral> {
    if (this.clientOverride) {
      return this.clientOverride;
    }
    const apiKey = this.getApiKey();
    const { Mistral: MistralClient } = await import('@mistralai/mistralai');
    return new MistralClient({ apiKey });
  }

  /**
   * Calls Mistral OCR endpoint using direct Base64 Data URL
   * to extract structured bill data without persistent cloud storage.
   *
   * @param pdfBytes Validated PDF file buffer
   * @param filename Original filename of the document
   */
  async extractBillFromPdf(
    pdfBytes: Buffer,
    filename: string
  ): Promise<MistralExtractionResult> {
    const client = await this.getClient();
    const model = this.getModelName();

    // Construct direct Base64 Data URL for zero-persistence document processing
    const base64Data = pdfBytes.toString('base64');
    const documentUrl = `data:application/pdf;base64,${base64Data}`;

    try {
      const ocrResponse = await client.ocr.process({
        model,
        document: {
          type: 'document_url',
          documentUrl,
          documentName: filename,
        },
        documentAnnotationFormat: {
          type: 'json_schema',
          jsonSchema: BILL_EXTRACTION_JSON_SCHEMA,
        },
        documentAnnotationPrompt: BILL_EXTRACTION_PROMPT,
        includeImageBase64: false, // Lean response payload
      });

      // Parse structured JSON annotation if returned
      let extractedData: ExtractedBill | null = null;
      const rawAnnotation = ocrResponse.documentAnnotation || null;

      if (rawAnnotation) {
        try {
          const parsed = typeof rawAnnotation === 'string' ? JSON.parse(rawAnnotation) : rawAnnotation;
          const validated = extractedBillSchema.safeParse(parsed);
          if (validated.success) {
            extractedData = validated.data;
          } else {
            console.warn('[Mistral OCR] Annotation schema validation issue:', validated.error.issues);
            // Strict sanitization: ensure missing or ambiguous values default cleanly to null
            extractedData = {
              companyName: typeof parsed?.companyName === 'string' && parsed.companyName.trim() ? parsed.companyName.trim() : null,
              billNumber: typeof parsed?.billNumber === 'string' && parsed.billNumber.trim() ? parsed.billNumber.trim() : null,
              amount: typeof parsed?.amount === 'number' && Number.isFinite(parsed.amount) && parsed.amount > 0 ? parsed.amount : null,
              date: typeof parsed?.date === 'string' && parsed.date.trim() ? parsed.date.trim() : null,
              dalaliRate: typeof parsed?.dalaliRate === 'number' && Number.isFinite(parsed.dalaliRate) && parsed.dalaliRate >= 0 ? parsed.dalaliRate : null,
              dalaliAmount: typeof parsed?.dalaliAmount === 'number' && Number.isFinite(parsed.dalaliAmount) && parsed.dalaliAmount >= 0 ? parsed.dalaliAmount : null,
              description: typeof parsed?.description === 'string' && parsed.description.trim() ? parsed.description.trim() : null,
            };
          }
        } catch (jsonErr) {
          console.warn('[Mistral OCR] Failed to parse documentAnnotation JSON');
        }
      }

      // Map OCR markdown per page
      const pages = (ocrResponse.pages || []).map((p) => ({
        index: p.index,
        markdown: p.markdown || '',
      }));

      return {
        model: ocrResponse.model || model,
        pageCount: pages.length,
        pages,
        extractedData,
        rawAnnotation,
        usage: {
          pagesProcessed: ocrResponse.usageInfo?.pagesProcessed ?? pages.length,
          docSizeBytes: ocrResponse.usageInfo?.docSizeBytes ?? pdfBytes.length,
        },
      };
    } catch (err: unknown) {
      this.handleProviderError(err);
    }
  }

  /**
   * Translates SDK / HTTP errors to clean domain errors without leaking secrets or document data
   */
  private handleProviderError(err: unknown): never {
    if (err instanceof MistralAIError) {
      throw err;
    }

    const anyErr = err as any;
    const status = anyErr?.statusCode ?? anyErr?.status ?? anyErr?.httpMeta?.response?.status;
    const errMessage: string = (anyErr?.message || '').toLowerCase();

    // Authentication failure
    if (status === 401 || errMessage.includes('unauthorized') || errMessage.includes('invalid api key')) {
      throw new MistralAuthError('Mistral authentication failed. Please check MISTRAL_API_KEY credentials.');
    }

    // Rate limit or quota exhausted
    if (status === 429 || errMessage.includes('rate limit') || errMessage.includes('quota') || errMessage.includes('too many requests')) {
      throw new MistralRateLimitError('Mistral OCR rate limit exceeded or credit balance exhausted.');
    }

    // Timeout errors
    if (
      status === 504 ||
      errMessage.includes('timeout') ||
      errMessage.includes('timed out') ||
      anyErr?.code === 'ETIMEDOUT' ||
      anyErr?.code === 'ECONNABORTED'
    ) {
      throw new MistralTimeoutError('Mistral OCR service request timed out.');
    }

    // Upstream server errors (500, 502, 503)
    if (status && status >= 500) {
      throw new MistralUpstreamError(`Mistral OCR upstream server error (HTTP ${status}).`);
    }

    // Network / connection errors
    if (anyErr?.code === 'ENOTFOUND' || anyErr?.code === 'ECONNREFUSED') {
      throw new MistralUpstreamError('Network connection to Mistral API failed.');
    }

    // Fallback safe error message
    throw new MistralAIError(
      'An unexpected error occurred during Mistral OCR document extraction.',
      status || 500
    );
  }
}

export const mistralDocumentAIService = new MistralDocumentAIService();
