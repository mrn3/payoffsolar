import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { executeSingle } from '@/lib/mysql/connection';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const mimeType = file.type;
    if (!mimeType.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Limit to ~5MB
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be 5MB or smaller' }, { status: 400 });
    }

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/gif' ? 'gif' : 'jpg';
    const fileName = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');

    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/avatars/${fileName}`;

    await executeSingle(
      'UPDATE profiles SET avatar_url = ? WHERE id = ?',
      [publicUrl, session.user.id]
    );

    return NextResponse.json({ avatarUrl: publicUrl });
  } catch (error: unknown) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload avatar' },
      { status: 400 }
    );
  }
}

