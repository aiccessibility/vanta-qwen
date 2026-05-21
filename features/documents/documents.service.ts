import { createServerClient } from '@/services/supabase/client';
import { OCRService } from '@/services/ocr';

export interface DocumentUploadResult {
  id: string;
  fileUrl: string;
  status: string;
}

/**
 * Documents Service
 * Handles document uploads, listing, and processing
 */
export class DocumentsService {
  /**
   * Upload a document
   */
  static async uploadDocument(
    file: File,
    organizationId: string,
    userId: string,
    type: 'invoice' | 'receipt' | 'contract' | 'tax_form' | 'other' = 'other'
  ): Promise<DocumentUploadResult> {
    const supabase = createServerClient();

    // Verify user has access to the organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!member) {
      throw new Error('Unauthorized access to organization');
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${organizationId}/documents/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create document record
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        type,
        uploaded_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (docError) throw docError;

    return {
      id: docRecord.id,
      fileUrl: urlData.publicUrl,
      status: docRecord.status,
    };
  }

  /**
   * List documents for an organization
   */
  static async listDocuments(
    organizationId: string,
    options: {
      type?: 'invoice' | 'receipt' | 'contract' | 'tax_form' | 'other';
      status?: 'pending' | 'processing' | 'completed' | 'failed';
      page?: number;
      limit?: number;
    } = {}
  ) {
    const supabase = createServerClient();
    const { type, status, page = 1, limit = 50 } = options;

    let query = supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles (
          id,
          email,
          full_name
        )
      `)
      .eq('organization_id', organizationId);

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false });

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  }

  /**
   * Get a single document by ID
   */
  static async getDocument(documentId: string, organizationId: string) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        uploader:profiles (
          id,
          email,
          full_name
        )
      `)
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (error) throw error;

    return data;
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string, organizationId: string) {
    const supabase = createServerClient();

    // Get document to find file path
    const { data: doc } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (!doc) {
      throw new Error('Document not found');
    }

    // Extract file path from URL
    const urlParts = doc.file_url.split('/storage/v1/object/public/documents/');
    const filePath = urlParts.length > 1 ? urlParts[1] : null;

    // Delete from storage if we have the path
    if (filePath) {
      await supabase.storage
        .from('documents')
        .remove([filePath]);
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;

    return true;
  }

  /**
   * Process a document with OCR
   */
  static async processDocument(documentId: string) {
    const supabase = createServerClient();

    // Update status to processing
    await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    try {
      // Get document
      const { data: doc } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (!doc) {
        throw new Error('Document not found');
      }

      // Process with OCR
      const ocrResult = await OCRService.processDocument(doc.file_url);
      const extractedData = await OCRService.extractStructuredData(ocrResult.text);

      // Update document with results
      await OCRService.updateDocumentWithOCR(documentId, ocrResult, extractedData);

      return { success: true, data: extractedData };
    } catch (error) {
      // Update status to failed
      await supabase
        .from('documents')
        .update({ 
          status: 'failed',
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId);

      throw error;
    }
  }

  /**
   * Get document download URL
   */
  static async getDownloadUrl(documentId: string) {
    const supabase = createServerClient();

    const { data: doc } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (!doc) {
      throw new Error('Document not found');
    }

    return doc.file_url;
  }
}
