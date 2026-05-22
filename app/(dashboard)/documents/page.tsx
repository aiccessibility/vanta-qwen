'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { DocumentService } from '@/features/documents/documents.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentItem {
  id: string;
  file_url: string;
  type: 'invoice' | 'receipt' | 'contract' | 'other';
  status: 'pending' | 'processing' | 'completed' | 'error';
  parsed_json: any | null;
  confidence_score: number | null;
  created_at: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const supabase = createClientComponentClient();
  const documentService = new DocumentService(supabase);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const docs = await documentService.listDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Subir archivo al storage
      const uploadResult = await documentService.uploadDocument(file, 'invoice');
      
      // Añadir entrada en la base de datos
      await documentService.createDocument({
        file_url: uploadResult.path,
        type: 'invoice',
        status: 'pending',
      });

      // Trigger manual del proceso OCR (en producción esto sería un webhook/trigger)
      await documentService.processOCR(uploadResult.id);
      
      await fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
      // Reset input
      const input = document.getElementById('file-upload') as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      processing: 'secondary',
      error: 'destructive',
      pending: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
        <div className="relative">
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button disabled={uploading} className="cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Documento
                </>
              )}
            </Button>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay documentos</h3>
            <p className="text-muted-foreground mt-1">Sube tu primera factura o recibo para comenzar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(doc.status)}
                  <CardTitle className="text-sm font-medium truncate max-w-[200px]">
                    {doc.type === 'invoice' ? 'Factura' : doc.type === 'receipt' ? 'Recibo' : 'Documento'}
                  </CardTitle>
                </div>
                {getStatusBadge(doc.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Subido: {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
                  </div>
                  
                  {doc.status === 'completed' && doc.parsed_json && (
                    <div className="bg-muted/50 p-2 rounded-md text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{doc.parsed_json.total?.amount || 'N/A'} {doc.parsed_json.total?.currency || 'EUR'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Proveedor:</span>
                        <span className="font-medium truncate max-w-[120px]">{doc.parsed_json.vendor || 'Desconocido'}</span>
                      </div>
                      {doc.confidence_score && (
                        <div className="flex justify-between items-center pt-1 border-t border-muted">
                          <span className="text-muted-foreground">Confianza:</span>
                          <span className={`font-medium ${doc.confidence_score > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                            {(doc.confidence_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {doc.status === 'error' && (
                    <div className="text-xs text-red-500 flex items-center mt-2">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Error al procesar
                    </div>
                  )}
                </div>
                
                <div className="mt-4 flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, '_blank')}>
                    Ver
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      if(confirm('¿Estás seguro de eliminar este documento?')) {
                        await documentService.deleteDocument(doc.id);
                        fetchDocuments();
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
