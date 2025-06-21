import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireAuth, isAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file.name) {
        continue;
      }

      // Validate file type - only PDF files allowed
      if (file.type !== 'application/pdf') {
        return NextResponse.json({
          error: `Invalid file type: ${file.type}. Only PDF files are allowed.`
        }, { status: 400 });
      }

      // Validate file size (max 10MB for PDFs)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json({
          error: `File ${file.name} is too large. Maximum size is 10MB.`
        }, { status: 400 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'datasheets');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // Directory might already exist, ignore error
      }

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);

      // Return relative URL for database storage
      const pdfUrl = `/uploads/datasheets/${filename}`;
      uploadedFiles.push({
        originalName: file.name,
        filename,
        url: pdfUrl,
        size: file.size,
        type: file.type
      });
    }

    return NextResponse.json({
      message: 'PDF files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('Error uploading PDF files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
