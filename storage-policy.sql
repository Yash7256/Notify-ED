-- storage-policy.sql
-- Setup Supabase Storage bucket and policies for PushMarks

-- 1. Create a private bucket named "marks-sheets"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('marks-sheets', 'marks-sheets', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for "marks-sheets"
-- Ensures that only authenticated users (professors) can interact with the files.
-- Access will typically be provided via signed URLs.

-- Allow authenticated users to upload/insert files
CREATE POLICY "Allow authenticated users to insert objects"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'marks-sheets' );

-- Allow authenticated users to read/select files (needed to generate signed URLs from the client)
CREATE POLICY "Allow authenticated users to select objects"
ON storage.objects FOR SELECT TO authenticated
USING ( bucket_id = 'marks-sheets' );

-- Allow authenticated users to update files (if they overwrite a previously uploaded sheet)
CREATE POLICY "Allow authenticated users to update objects"
ON storage.objects FOR UPDATE TO authenticated
USING ( bucket_id = 'marks-sheets' );

-- Optional: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete objects"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'marks-sheets' );
