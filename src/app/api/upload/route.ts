import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { requireAuth , isAdmin} from '@/lib/auth';

export async function POST(_request: NextRequest) {
  try {
    // Require admin access
    const session = await requireAuth();
    if (!isAdmin(session.profile.role)) {
      return NextResponse.json({ _error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ _error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (!file.name) {
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(_file.type)) {
        return NextResponse.json({ 
          _error: `Invalid file type: ${file.type}. Only JPEG, PNG, and WebP images are allowed.` 
        }, { status: 400 });
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (_file.size > maxSize) {
        return NextResponse.json({ 
          _error: `File ${file.name} is too large. Maximum size is 5MB.` 
        }, { status: 400 });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop();
      const filename = `${timestamp}-${randomString}.${extension}`;

      // Create upload directory if it doesn't exist
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'products');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (_error) {
        // Directory might already exist, ignore error
      }

      // Save file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filepath = join(uploadDir, filename);
      
      await writeFile(filepath, buffer);

      // Return relative URL for database storage
      const imageUrl = `/uploads/products/${filename}`;
      uploadedFiles.push({
        originalName: file.name,
        filename,
        url: imageUrl,
        size: file.size,
        type: file.type
      });
    }

    return NextResponse.json({ 
      message: 'Files uploaded successfully',
      files: uploadedFiles 
    });

  } catch (_error) {
    console.error('Error uploading files:', _error);
    return NextResponse.json({ _error: 'Internal server error' }, { status: 500 });
  }
}
