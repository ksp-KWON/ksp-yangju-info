import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';

export const dynamic = 'force-static';

export async function GET() {
  try {
    const posts = getSortedPostsData();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('API Error fetching posts:', error);
    return NextResponse.json([]);
  }
}
