
-- Create enum for analysis status
CREATE TYPE public.analysis_status AS ENUM ('Draft', 'In Progress', 'Completed', 'Archived');

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('Financial Statement', 'Invoice', 'Contract', 'Receipt', 'Other');

-- Create enum for red flag severity
CREATE TYPE public.red_flag_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  filename TEXT NOT NULL,
  document_type document_type DEFAULT 'Other',
  file_size INTEGER,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status analysis_status DEFAULT 'Draft',
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create red_flags table
CREATE TABLE public.red_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  analysis_id UUID REFERENCES public.analyses(id),
  document_id UUID REFERENCES public.documents(id),
  title TEXT NOT NULL,
  description TEXT,
  severity red_flag_severity DEFAULT 'Low',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activities table for activity feed
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.red_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for analyses
CREATE POLICY "Users can view their own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analyses" ON public.analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analyses" ON public.analyses FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for red_flags
CREATE POLICY "Users can view their own red flags" ON public.red_flags FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own red flags" ON public.red_flags FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own red flags" ON public.red_flags FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own red flags" ON public.red_flags FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for all tables
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.analyses REPLICA IDENTITY FULL;
ALTER TABLE public.red_flags REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.red_flags;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Insert some sample data for testing
INSERT INTO public.documents (user_id, filename, document_type, file_size, processed) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Q3_Financial_Statement.pdf', 'Financial Statement', 2048576, true),
  ((SELECT id FROM auth.users LIMIT 1), 'Invoice_001.pdf', 'Invoice', 512000, true),
  ((SELECT id FROM auth.users LIMIT 1), 'Contract_ABC.pdf', 'Contract', 1024000, false);

INSERT INTO public.analyses (user_id, title, description, status, compliance_score) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Q3 Financial Review', 'Comprehensive analysis of Q3 financial statements', 'Completed', 85),
  ((SELECT id FROM auth.users LIMIT 1), 'Invoice Audit', 'Monthly invoice compliance check', 'In Progress', 72),
  ((SELECT id FROM auth.users LIMIT 1), 'Contract Review', 'Legal compliance verification', 'Draft', NULL);

INSERT INTO public.red_flags (user_id, analysis_id, title, description, severity, resolved) VALUES
  ((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM public.analyses WHERE title = 'Q3 Financial Review' LIMIT 1), 'Missing Documentation', 'Required supporting documents not found', 'High', false),
  ((SELECT id FROM auth.users LIMIT 1), (SELECT id FROM public.analyses WHERE title = 'Invoice Audit' LIMIT 1), 'Duplicate Entry', 'Potential duplicate invoice detected', 'Medium', false);

INSERT INTO public.activities (user_id, action, entity_type, description) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Document Uploaded', 'Document', 'Q3_Financial_Statement.pdf uploaded successfully'),
  ((SELECT id FROM auth.users LIMIT 1), 'Analysis Created', 'Analysis', 'New analysis "Q3 Financial Review" created'),
  ((SELECT id FROM auth.users LIMIT 1), 'Red Flag Identified', 'Red Flag', 'High severity issue found in financial review');

INSERT INTO public.notifications (user_id, title, message, read) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Analysis Complete', 'Q3 Financial Review has been completed', false),
  ((SELECT id FROM auth.users LIMIT 1), 'New Red Flag', 'High priority issue requires attention', false),
  ((SELECT id FROM auth.users LIMIT 1), 'Document Processed', 'Invoice_001.pdf has been processed', true);
