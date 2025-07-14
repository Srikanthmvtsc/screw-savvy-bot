-- Create documents table for PDF metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT DEFAULT 'application/pdf',
  storage_path TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_chunks table for text chunks
CREATE TABLE public.document_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create embeddings table for vector storage
CREATE TABLE public.embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id UUID NOT NULL REFERENCES public.document_chunks(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embeddings dimension
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can view their own documents" 
ON public.documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.documents 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for document_chunks (inherit from documents)
CREATE POLICY "Users can view chunks of their documents" 
ON public.document_chunks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can create chunks for their documents" 
ON public.document_chunks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can update chunks of their documents" 
ON public.document_chunks 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can delete chunks of their documents" 
ON public.document_chunks 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.documents 
  WHERE documents.id = document_chunks.document_id 
  AND documents.user_id = auth.uid()
));

-- Create policies for embeddings (inherit from document_chunks)
CREATE POLICY "Users can view embeddings of their document chunks" 
ON public.embeddings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.document_chunks 
  JOIN public.documents ON documents.id = document_chunks.document_id
  WHERE document_chunks.id = embeddings.chunk_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can create embeddings for their document chunks" 
ON public.embeddings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.document_chunks 
  JOIN public.documents ON documents.id = document_chunks.document_id
  WHERE document_chunks.id = embeddings.chunk_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can update embeddings of their document chunks" 
ON public.embeddings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.document_chunks 
  JOIN public.documents ON documents.id = document_chunks.document_id
  WHERE document_chunks.id = embeddings.chunk_id 
  AND documents.user_id = auth.uid()
));

CREATE POLICY "Users can delete embeddings of their document chunks" 
ON public.embeddings 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.document_chunks 
  JOIN public.documents ON documents.id = document_chunks.document_id
  WHERE document_chunks.id = embeddings.chunk_id 
  AND documents.user_id = auth.uid()
));

-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);

-- Create storage policies
CREATE POLICY "Users can upload their own PDFs" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PDFs" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PDFs" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for better performance
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_document_chunks_document_id ON public.document_chunks(document_id);
CREATE INDEX idx_embeddings_chunk_id ON public.embeddings(chunk_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable vector extension for similarity search
CREATE EXTENSION IF NOT EXISTS vector;