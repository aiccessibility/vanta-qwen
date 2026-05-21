import { createServerClient } from '@/services/supabase/client';

export interface OCRResult {
  text: string;
  confidence: number;
  fields: {
    type?: 'invoice' | 'receipt';
    vendor?: string;
    date?: string;
    total?: number;
    tax?: number;
    currency?: string;
    lineItems?: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
  };
}

/**
 * OCR Service
 * Handles document text extraction and data parsing
 */
export class OCRService {
  /**
   * Process a document image and extract text
   */
  static async processDocument(fileUrl: string): Promise<OCRResult> {
    // In production, this would use Google Cloud Vision or AWS Textract
    // For now, we'll use Tesseract.js on the client side
    
    return {
      text: '',
      confidence: 0,
      fields: {},
    };
  }

  /**
   * Extract structured data from OCR result
   */
  static async extractStructuredData(ocrText: string): Promise<OCRResult['fields']> {
    // Simple regex-based extraction
    // In production, this would use an ML model
    
    const fields: OCRResult['fields'] = {};

    // Extract total amount
    const totalMatch = ocrText.match(/total[:\s]*([0-9]+[.,][0-9]{2})/i);
    if (totalMatch) {
      fields.total = parseFloat(totalMatch[1].replace(',', '.'));
    }

    // Extract VAT/tax
    const taxMatch = ocrText.match(/vat[:\s]*([0-9]+[.,][0-9]{2})/i) ||
                     ocrText.match(/tax[:\s]*([0-9]+[.,][0-9]{2})/i) ||
                     ocrText.match(/iva[:\s]*([0-9]+[.,][0-9]{2})/i);
    if (taxMatch) {
      fields.tax = parseFloat(taxMatch[1].replace(',', '.'));
    }

    // Extract date
    const dateMatch = ocrText.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (dateMatch) {
      fields.date = dateMatch[1];
    }

    // Detect document type
    if (/invoice/i.test(ocrText)) {
      fields.type = 'invoice';
    } else if (/receipt/i.test(ocrText)) {
      fields.type = 'receipt';
    }

    return fields;
  }

  /**
   * Update document with OCR results
   */
  static async updateDocumentWithOCR(
    documentId: string,
    ocrResult: OCRResult,
    extractedData: OCRResult['fields']
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('documents')
      .update({
        ocr_text: ocrResult.text,
        extracted_data: extractedData as any,
        parsed_json: ocrResult as any,
        confidence_score: ocrResult.confidence,
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Create a transaction from extracted document data
   */
  static async createTransactionFromDocument(
    documentId: string,
    bankAccountId: string,
    extractedData: OCRResult['fields']
  ) {
    const supabase = createServerClient();

    if (!extractedData.total || !extractedData.vendor) {
      throw new Error('Missing required fields for transaction creation');
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        bank_account_id: bankAccountId,
        amount: -Math.abs(extractedData.total), // Expenses are negative
        currency: extractedData.currency || 'EUR',
        merchant: extractedData.vendor,
        description: `From document ${documentId}`,
        category: this.inferCategory(extractedData.vendor),
        confidence_score: extractedData.type ? 0.8 : 0.5,
        transaction_type: 'expense',
        timestamp: extractedData.date || new Date().toISOString(),
        metadata: { document_id: documentId },
      })
      .select()
      .single();

    if (error) throw error;

    // Link document to transaction
    await supabase
      .from('documents')
      .update({ metadata: { transaction_id: data.id } as any })
      .eq('id', documentId);

    return data;
  }

  /**
   * Infer category from vendor name
   */
  private static inferCategory(vendor: string): string {
    const lowerVendor = vendor.toLowerCase();
    
    if (lowerVendor.includes('restaurant') || lowerVendor.includes('cafe') || lowerVendor.includes('food')) {
      return 'meals';
    }
    if (lowerVendor.includes('hotel') || lowerVendor.includes('airbnb')) {
      return 'accommodation';
    }
    if (lowerVendor.includes('uber') || lowerVendor.includes('taxi') || lowerVendor.includes('train')) {
      return 'transportation';
    }
    if (lowerVendor.includes('amazon') || lowerVendor.includes('store') || lowerVendor.includes('shop')) {
      return 'supplies';
    }
    if (lowerVendor.includes('google') || lowerVendor.includes('microsoft') || lowerVendor.includes('software')) {
      return 'software';
    }
    if (lowerVendor.includes('aws') || lowerVendor.includes('cloud') || lowerVendor.includes('server')) {
      return 'infrastructure';
    }

    return 'other';
  }

  /**
   * Get pending documents for OCR processing
   */
  static async getPendingDocuments(organizationId: string, limit = 10) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return data;
  }
}
