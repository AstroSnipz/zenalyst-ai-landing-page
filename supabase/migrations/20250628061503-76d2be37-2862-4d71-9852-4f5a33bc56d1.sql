
-- Create storage buckets for different document types
INSERT INTO storage.buckets (id, name, public) VALUES
  ('revenue-documents', 'revenue-documents', true),
  ('payroll-documents', 'payroll-documents', true),
  ('purchase-order-documents', 'purchase-order-documents', true);

-- Create storage policies for the buckets (permissive for now)
CREATE POLICY "Allow all operations on revenue documents" ON storage.objects
  FOR ALL USING (bucket_id = 'revenue-documents');

CREATE POLICY "Allow all operations on payroll documents" ON storage.objects
  FOR ALL USING (bucket_id = 'payroll-documents');

CREATE POLICY "Allow all operations on purchase order documents" ON storage.objects
  FOR ALL USING (bucket_id = 'purchase-order-documents');

-- Update documents table to include file_url and upload_status
ALTER TABLE public.documents 
ADD COLUMN file_url TEXT,
ADD COLUMN upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
ADD COLUMN bucket_name TEXT;

-- Create index for faster queries
CREATE INDEX idx_documents_user_type ON public.documents(user_id, document_type);
CREATE INDEX idx_documents_upload_status ON public.documents(upload_status);
