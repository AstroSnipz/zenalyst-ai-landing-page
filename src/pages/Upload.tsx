
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string;
  documentId?: string;
}

const Upload = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('revenue');
  const [files, setFiles] = useState<{ [key: string]: UploadFile[] }>({
    revenue: [],
    payroll: [],
    orders: []
  });

  const getBucketName = (type: string) => {
    const bucketMap = {
      revenue: 'revenue-documents',
      payroll: 'payroll-documents',
      orders: 'purchase-order-documents'
    };
    return bucketMap[type as keyof typeof bucketMap];
  };

  const getDocumentType = (type: string) => {
    const typeMap = {
      revenue: 'Financial Statement',
      payroll: 'Other',
      orders: 'Invoice'
    };
    return typeMap[type as keyof typeof typeMap];
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (file.size > maxSize) {
      return 'File size must be less than 10MB';
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, Excel, Word, or Image files';
    }

    return null;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList, type: string) => {
    const newFiles: UploadFile[] = [];
    
    Array.from(selectedFiles).forEach(file => {
      const validation = validateFile(file);
      if (validation) {
        toast({
          title: 'Invalid File',
          description: `${file.name}: ${validation}`,
          variant: 'destructive'
        });
        return;
      }

      newFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending'
      });
    });

    if (newFiles.length > 0) {
      setFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...newFiles]
      }));
    }
  }, []);

  const uploadFile = async (uploadFile: UploadFile, type: string) => {
    if (!user) return;

    const bucketName = getBucketName(type);
    const fileName = `${Date.now()}-${uploadFile.file.name}`;
    
    try {
      // Update status to uploading
      setFiles(prev => ({
        ...prev,
        [type]: prev[type].map(f => 
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
        )
      }));

      // Create document record first
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: uploadFile.file.name,
          document_type: getDocumentType(type) as any,
          file_size: uploadFile.file.size,
          upload_status: 'uploading',
          bucket_name: bucketName
        })
        .select()
        .single();

      if (docError) throw docError;

      // Upload to storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, uploadFile.file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Update document with file URL and completion status
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          file_url: publicUrl,
          upload_status: 'completed',
          processed: false
        })
        .eq('id', docData.id);

      if (updateError) throw updateError;

      // Update local state
      setFiles(prev => ({
        ...prev,
        [type]: prev[type].map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'completed' as const, progress: 100, url: publicUrl, documentId: docData.id }
            : f
        )
      }));

      // Log activity
      await supabase.from('activities').insert({
        user_id: user.id,
        action: 'Document Uploaded',
        entity_type: 'Document',
        entity_id: docData.id,
        description: `${uploadFile.file.name} uploaded successfully`
      });

      toast({
        title: 'Upload Successful',
        description: `${uploadFile.file.name} has been uploaded successfully.`
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      setFiles(prev => ({
        ...prev,
        [type]: prev[type].map(f => 
          f.id === uploadFile.id ? { ...f, status: 'failed' as const } : f
        )
      }));

      toast({
        title: 'Upload Failed',
        description: `Failed to upload ${uploadFile.file.name}. Please try again.`,
        variant: 'destructive'
      });
    }
  };

  const handleUploadAll = async (type: string) => {
    const pendingFiles = files[type].filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await uploadFile(file, type);
    }
  };

  const removeFile = async (fileId: string, type: string) => {
    const file = files[type].find(f => f.id === fileId);
    
    if (file?.documentId && file.status === 'completed') {
      try {
        // Delete from storage if uploaded
        if (file.url) {
          const bucketName = getBucketName(type);
          const filePath = file.url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from(bucketName)
              .remove([filePath]);
          }
        }

        // Delete from database
        await supabase
          .from('documents')
          .delete()
          .eq('id', file.documentId);

        toast({
          title: 'File Removed',
          description: `${file.file.name} has been removed successfully.`
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to remove file completely.',
          variant: 'destructive'
        });
      }
    }

    // Remove from local state
    setFiles(prev => ({
      ...prev,
      [type]: prev[type].filter(f => f.id !== fileId)
    }));
  };

  const handleProcessDocuments = async (type: string) => {
    if (!user) return;

    const completedFiles = files[type].filter(f => f.status === 'completed');
    
    if (completedFiles.length === 0) {
      toast({
        title: 'No Files to Process',
        description: 'Please upload some files first.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Create analysis record
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Analysis - ${new Date().toLocaleDateString()}`,
          description: `Analysis created from ${completedFiles.length} uploaded documents`,
          status: 'In Progress'
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Update documents to mark as processed
      const documentIds = completedFiles.map(f => f.documentId).filter(Boolean);
      
      if (documentIds.length > 0) {
        await supabase
          .from('documents')
          .update({ processed: true })
          .in('id', documentIds);
      }

      // Log activity
      await supabase.from('activities').insert({
        user_id: user.id,
        action: 'Analysis Started',
        entity_type: 'Analysis',
        entity_id: analysisData.id,
        description: `Started processing ${completedFiles.length} documents`
      });

      toast({
        title: 'Processing Started',
        description: `Analysis created and processing ${completedFiles.length} documents.`
      });

    } catch (error) {
      toast({
        title: 'Processing Failed',
        description: 'Failed to start document processing.',
        variant: 'destructive'
      });
    }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>, type: string) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles, type);
  }, [handleFileSelect]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderUploadZone = (type: string) => (
    <div className="space-y-6">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50"
        onDrop={(e) => onDrop(e, type)}
        onDragOver={onDragOver}
        onClick={() => document.getElementById(`file-input-${type}`)?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: PDF, Excel, Word, Images
        </p>
        <p className="text-xs text-gray-400">
          Maximum file size: 10MB per file
        </p>
        <input
          id={`file-input-${type}`}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.gif"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files, type)}
        />
      </div>

      {files[type].length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Files ({files[type].length})</h3>
            <div className="space-x-2">
              <Button
                onClick={() => handleUploadAll(type)}
                disabled={!files[type].some(f => f.status === 'pending')}
                size="sm"
              >
                Upload All
              </Button>
              <Button
                onClick={() => handleProcessDocuments(type)}
                disabled={!files[type].some(f => f.status === 'completed')}
                size="sm"
                variant="outline"
              >
                Process Documents
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {files[type].map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg bg-white">
                <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.file.size)}
                  </p>
                  
                  {file.status === 'uploading' && (
                    <div className="mt-2">
                      <Progress value={file.progress} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {file.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => uploadFile(file, type)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Upload
                    </Button>
                  )}
                  
                  {file.status === 'uploading' && (
                    <div className="text-blue-500">
                      <AlertCircle className="h-5 w-5 animate-spin" />
                    </div>
                  )}
                  
                  {file.status === 'completed' && (
                    <div className="text-green-500">
                      <Check className="h-5 w-5" />
                    </div>
                  )}
                  
                  {file.status === 'failed' && (
                    <div className="text-red-500">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id, type)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Upload</h1>
          <p className="text-gray-600">Upload and manage your business documents for analysis</p>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">Upload Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="revenue" className="text-sm font-medium">
                  Revenue Documents
                </TabsTrigger>
                <TabsTrigger value="payroll" className="text-sm font-medium">
                  Payroll Documents
                </TabsTrigger>
                <TabsTrigger value="orders" className="text-sm font-medium">
                  Purchase Orders
                </TabsTrigger>
              </TabsList>

              <TabsContent value="revenue">
                {renderUploadZone('revenue')}
              </TabsContent>

              <TabsContent value="payroll">
                {renderUploadZone('payroll')}
              </TabsContent>

              <TabsContent value="orders">
                {renderUploadZone('orders')}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
