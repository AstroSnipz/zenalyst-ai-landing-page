
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload as UploadIcon, FileText, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  url?: string;
  category: string;
  subcategory: string;
}

const documentCategories = {
  revenue: {
    name: 'Revenue',
    subcategories: {
      agreement: 'Agreement',
      invoice: 'Invoice',
      sales: 'Sales'
    },
    bucket: 'revenue-documents'
  },
  payroll: {
    name: 'Payroll',
    subcategories: {
      master: 'Master',
      policies: 'HR Policies'
    },
    bucket: 'payroll-documents'
  },
  'purchase-order': {
    name: 'Purchase Order',
    subcategories: {
      agreement: 'Agreement',
      po: 'Purchase Order',
      invoice: 'Invoice',
      pr: 'Purchase Request'
    },
    bucket: 'purchase-order-documents'
  }
};

const Upload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<Record<string, FileUpload[]>>({
    revenue: [],
    payroll: [],
    'purchase-order': []
  });
  const [activeTab, setActiveTab] = useState('revenue');
  const [processing, setProcessing] = useState(false);

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `${file.name} exceeds 10MB limit`,
        variant: "destructive"
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not a supported format`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (fileUpload: FileUpload, category: string, subcategory: string) => {
    if (!user) return;

    const bucket = documentCategories[category as keyof typeof documentCategories].bucket;
    const fileName = `${Date.now()}-${fileUpload.file.name}`;
    const filePath = `${user.id}/${subcategory}/${fileName}`;

    try {
      // Update status to uploading
      setFiles(prev => ({
        ...prev,
        [category]: prev[category].map(f => 
          f.id === fileUpload.id 
            ? { ...f, status: 'uploading' as const, progress: 25 }
            : f
        )
      }));

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileUpload.file);

      if (uploadError) throw uploadError;

      // Update progress
      setFiles(prev => ({
        ...prev,
        [category]: prev[category].map(f => 
          f.id === fileUpload.id 
            ? { ...f, progress: 75 }
            : f
        )
      }));

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: fileUpload.file.name,
          file_size: fileUpload.file.size,
          document_type: subcategory as any,
          file_url: publicUrl,
          bucket_name: bucket,
          upload_status: 'completed'
        });

      if (dbError) throw dbError;

      // Update file status to completed
      setFiles(prev => ({
        ...prev,
        [category]: prev[category].map(f => 
          f.id === fileUpload.id 
            ? { ...f, status: 'completed' as const, progress: 100, url: publicUrl }
            : f
        )
      }));

      toast({
        title: "Upload successful",
        description: `${fileUpload.file.name} uploaded successfully`
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      setFiles(prev => ({
        ...prev,
        [category]: prev[category].map(f => 
          f.id === fileUpload.id 
            ? { ...f, status: 'failed' as const }
            : f
        )
      }));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${fileUpload.file.name}`,
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = useCallback((selectedFiles: FileList, category: string, subcategory: string) => {
    const validFiles = Array.from(selectedFiles).filter(validateFile);
    
    const newFiles: FileUpload[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending',
      category,
      subcategory
    }));

    setFiles(prev => ({
      ...prev,
      [category]: [...prev[category], ...newFiles]
    }));

    // Start uploading each file
    newFiles.forEach(fileUpload => {
      uploadFile(fileUpload, category, subcategory);
    });
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent, category: string, subcategory: string) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles, category, subcategory);
  }, [handleFileSelect]);

  const removeFile = async (fileId: string, category: string) => {
    const file = files[category].find(f => f.id === fileId);
    if (!file) return;

    // If file was successfully uploaded, delete from storage
    if (file.status === 'completed' && file.url) {
      try {
        const bucket = documentCategories[category as keyof typeof documentCategories].bucket;
        const filePath = file.url.split('/').slice(-3).join('/'); // Extract path from URL
        
        await supabase.storage
          .from(bucket)
          .remove([filePath]);

        // Also remove from database
        await supabase
          .from('documents')
          .delete()
          .eq('file_url', file.url)
          .eq('user_id', user?.id);
      } catch (error) {
        console.error('Error removing file:', error);
      }
    }

    setFiles(prev => ({
      ...prev,
      [category]: prev[category].filter(f => f.id !== fileId)
    }));
  };

  const processDocuments = async () => {
    if (!user) return;

    setProcessing(true);
    try {
      const completedFiles = Object.values(files).flat().filter(f => f.status === 'completed');
      
      if (completedFiles.length === 0) {
        toast({
          title: "No files to process",
          description: "Please upload some documents first",
          variant: "destructive"
        });
        return;
      }

      // Create analysis records for completed uploads
      const analysisPromises = completedFiles.map(file => 
        supabase
          .from('analyses')
          .insert({
            user_id: user.id,
            title: `Analysis for ${file.file.name}`,
            description: `Automated analysis for ${file.subcategory} document`,
            status: 'Draft'
          })
      );

      await Promise.all(analysisPromises);

      toast({
        title: "Processing started",
        description: `Started processing ${completedFiles.length} documents`
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: "Failed to start document processing",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderSubcategorySection = (category: string, subcategoryKey: string, subcategoryName: string) => {
    const categoryFiles = files[category].filter(f => f.subcategory === subcategoryKey);
    
    return (
      <div key={subcategoryKey} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{subcategoryName}</h3>
        
        {/* Upload Zone */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-gray-50 hover:bg-gray-100"
          onDrop={(e) => handleDrop(e, category, subcategoryKey)}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById(`file-input-${category}-${subcategoryKey}`)?.click()}
        >
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop {subcategoryName} files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supported formats: PDF, Excel, Word, Images (Max 10MB per file)
          </p>
          <Button variant="outline">Browse Files</Button>
        </div>

        <input
          id={`file-input-${category}-${subcategoryKey}`}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
          className="hidden"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files, category, subcategoryKey)}
        />

        {/* File List */}
        {categoryFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {categoryFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                <div className="flex items-center space-x-3 flex-1">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{file.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.file.size)} • {subcategoryName}
                    </p>
                    
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={file.progress} />
                        <p className="text-xs text-gray-500 mt-1">{file.progress}% uploaded</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {file.status === 'completed' && (
                    <Check className="h-5 w-5 text-green-500" />
                  )}
                  {file.status === 'failed' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  {file.status === 'uploading' && (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id, category)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const totalFiles = Object.values(files).flat().length;
  const completedFiles = Object.values(files).flat().filter(f => f.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Upload</h1>
          <p className="text-gray-600">
            Upload and manage your business documents across different categories
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {completedFiles} of {totalFiles} files uploaded
          </div>
          
          <Button
            onClick={processDocuments}
            disabled={processing || completedFiles === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {processing ? 'Processing...' : 'Process Documents'}
          </Button>
        </div>

        <Card className="border-0 shadow-xl bg-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              {Object.entries(documentCategories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-sm font-medium">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(documentCategories).map(([categoryKey, categoryData]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {categoryData.name} Documents
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Upload your {categoryData.name.toLowerCase()} related documents
                    </p>
                  </div>

                  {Object.entries(categoryData.subcategories).map(([subKey, subName]) =>
                    renderSubcategorySection(categoryKey, subKey, subName)
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Upload;
