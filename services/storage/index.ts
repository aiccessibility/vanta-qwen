import { createServerClient } from '@/services/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFileParams {
  file: File;
  bucket: string;
  path: string;
  organizationId: string;
}

export interface DownloadFileParams {
  bucket: string;
  path: string;
}

export interface DeleteFileParams {
  bucket: string;
  paths: string[];
}

/**
 * Storage Service
 * Handles file uploads, downloads, and deletions using Supabase Storage
 */
export class StorageService {
  /**
   * Upload a file to Supabase Storage
   */
  static async uploadFile({ file, bucket, path, organizationId }: UploadFileParams) {
    const supabase = createServerClient();

    // Verify user has access to the organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!member) {
      throw new Error('Unauthorized access to organization storage');
    }

    const fileExt = path.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${organizationId}/${path}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      path: data.path,
      fullPath: filePath,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
    };
  }

  /**
   * Download a file from Supabase Storage
   */
  static async downloadFile({ bucket, path }: DownloadFileParams) {
    const supabase = createServerClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) throw error;

    return data;
  }

  /**
   * Get a signed URL for private file access
   */
  static async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    const supabase = createServerClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;

    return data.signedUrl;
  }

  /**
   * Delete files from Supabase Storage
   */
  static async deleteFiles({ bucket, paths }: DeleteFileParams) {
    const supabase = createServerClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) throw error;

    return data;
  }

  /**
   * List files in a bucket path
   */
  static async listFiles(bucket: string, path: string, limit = 100) {
    const supabase = createServerClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path, {
        limit,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    if (error) throw error;

    return data;
  }

  /**
   * Create a document record after file upload
   */
  static async createDocumentRecord(
    organizationId: string,
    fileUrl: string,
    fileName: string,
    fileType: 'invoice' | 'receipt' | 'contract' | 'tax_form' | 'other',
    mimeType: string,
    fileSize: number,
    uploadedBy: string
  ) {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('documents')
      .insert({
        organization_id: organizationId,
        file_url: fileUrl,
        file_name: fileName,
        type: fileType,
        mime_type: mimeType,
        file_size: fileSize,
        uploaded_by: uploadedBy,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }
}
